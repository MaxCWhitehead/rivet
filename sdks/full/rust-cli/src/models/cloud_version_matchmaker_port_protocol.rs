/*
 * Rivet API
 *
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 0.0.1
 * 
 * Generated by: https://openapi-generator.tech
 */

/// CloudVersionMatchmakerPortProtocol : Signifies the protocol of the port. Note that when proxying through GameGuard (via `ProxyKind`), the port number returned by `/find`, `/join`, and `/create` will not be the same as the port number configured in the config:  - With HTTP, the port will always be 80. The hostname of the port correctly routes the incoming   connection to the correct port being used by the game server. - With HTTPS, the port will always be 443. The hostname of the port correctly routes the incoming   connection to the correct port being used by the game server. - Using TCP/UDP, the port will be a random number between 26000 and 31999. This gets automatically   routed to the correct port being used by the game server.  ### Related - cloud.version.matchmaker.GameModeRuntimeDockerPort - cloud.version.matchmaker.ProxyKind - /docs/dynamic-servers/concepts/game-guard - matchmaker.lobbies.find

/// Signifies the protocol of the port. Note that when proxying through GameGuard (via `ProxyKind`), the port number returned by `/find`, `/join`, and `/create` will not be the same as the port number configured in the config:  - With HTTP, the port will always be 80. The hostname of the port correctly routes the incoming   connection to the correct port being used by the game server. - With HTTPS, the port will always be 443. The hostname of the port correctly routes the incoming   connection to the correct port being used by the game server. - Using TCP/UDP, the port will be a random number between 26000 and 31999. This gets automatically   routed to the correct port being used by the game server.  ### Related - cloud.version.matchmaker.GameModeRuntimeDockerPort - cloud.version.matchmaker.ProxyKind - /docs/dynamic-servers/concepts/game-guard - matchmaker.lobbies.find
#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd, Hash, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub enum CloudVersionMatchmakerPortProtocol {
    #[serde(rename = "http")]
    Http,
    #[serde(rename = "https")]
    Https,
    #[serde(rename = "tcp")]
    Tcp,
    #[serde(rename = "tcp_tls")]
    TcpTls,
    #[serde(rename = "udp")]
    Udp,

}

impl ToString for CloudVersionMatchmakerPortProtocol {
    fn to_string(&self) -> String {
        match self {
            Self::Http => String::from("http"),
            Self::Https => String::from("https"),
            Self::Tcp => String::from("tcp"),
            Self::TcpTls => String::from("tcp_tls"),
            Self::Udp => String::from("udp"),
        }
    }
}

impl Default for CloudVersionMatchmakerPortProtocol {
    fn default() -> CloudVersionMatchmakerPortProtocol {
        Self::Http
    }
}




