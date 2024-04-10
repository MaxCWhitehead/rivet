use chirp_worker::prelude::*;
use cloudflare::{endpoints as cf, framework as cf_framework, framework::async_api::ApiClient};
use proto::backend::pkg::*;

#[worker(name = "cluster-server-dns-delete")]
async fn worker(
	ctx: &OperationContext<cluster::msg::server_dns_delete::Message>,
) -> GlobalResult<()> {
	let server_id = unwrap_ref!(ctx.server_id).as_uuid();
	let crdb = ctx.crdb().await?;

	let row = sql_fetch_optional!(
		[ctx, (String, Option<String>), &crdb]
		"
		SELECT dns_record_id, secondary_dns_record_id
		FROM db_cluster.cloudflare_misc
		WHERE server_id = $1
		",
		&server_id,
		util::timestamp::now(),
	)
	.await?;
	let Some((dns_record_id, secondary_dns_record_id)) = row else {
		tracing::warn!(?server_id, "server has no dns record");

		return Ok(());
	};

	let cf_token = util::env::read_secret(&["cloudflare", "terraform", "auth_token"]).await?;
	let zone_id = unwrap!(util::env::cloudflare::zone::job::id(), "dns not configured");

	// Create cloudflare HTTP client
	let client = cf_framework::async_api::Client::new(
		cf_framework::auth::Credentials::UserAuthToken { token: cf_token },
		Default::default(),
		cf_framework::Environment::Production,
	)
	.map_err(crate::CloudflareError::from)?;

	// Delete main record
	client
		.request(&cf::dns::DeleteDnsRecord {
			zone_identifier: zone_id,
			identifier: &dns_record_id,
		})
		.await?;

	// Delete secondary record
	if let Some(secondary_dns_record_id) = secondary_dns_record_id {
		client
			.request(&cf::dns::DeleteDnsRecord {
				zone_identifier: zone_id,
				identifier: &secondary_dns_record_id,
			})
			.await?;
	}

	// Remove db record
	sql_execute!(
		[ctx, &crdb]
		"
		DELETE FROM db_cluster.cloudflare_misc
		WHERE server_id = $1
		",
		server_id,
	)
	.await?;

	Ok(())
}