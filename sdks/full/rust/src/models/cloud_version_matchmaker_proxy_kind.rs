/*
 * Rivet API
 *
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 0.0.1
 * 
 * Generated by: https://openapi-generator.tech
 */

/// CloudVersionMatchmakerProxyKind : Denotes what type of proxying to use for ports. Rivet GameGuard adds DoS and DDoS mitigation to incoming connections.  ### Related - /docs/dynamic-servers/concepts/game-guard - cloud.version.matchmaker.PortProtocol

/// Denotes what type of proxying to use for ports. Rivet GameGuard adds DoS and DDoS mitigation to incoming connections.  ### Related - /docs/dynamic-servers/concepts/game-guard - cloud.version.matchmaker.PortProtocol
#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd, Hash, Serialize, Deserialize)]
pub enum CloudVersionMatchmakerProxyKind {
    #[serde(rename = "none")]
    None,
    #[serde(rename = "game_guard")]
    GameGuard,

}

impl ToString for CloudVersionMatchmakerProxyKind {
    fn to_string(&self) -> String {
        match self {
            Self::None => String::from("none"),
            Self::GameGuard => String::from("game_guard"),
        }
    }
}

impl Default for CloudVersionMatchmakerProxyKind {
    fn default() -> CloudVersionMatchmakerProxyKind {
        Self::None
    }
}




