// This file was auto-generated by Fern from our API Definition.

package client

import (
	http "net/http"
	adminclient "sdk/admin/client"
	authclient "sdk/auth/client"
	cloudclient "sdk/cloud/client"
	core "sdk/core"
	groupclient "sdk/group/client"
	identityclient "sdk/identity/client"
	jobclient "sdk/job/client"
	kvclient "sdk/kv/client"
	matchmakerclient "sdk/matchmaker/client"
	moduleclient "sdk/module/client"
	portalclient "sdk/portal/client"
	provisionclient "sdk/provision/client"
)

type Client struct {
	baseURL string
	caller  *core.Caller
	header  http.Header

	Admin      *adminclient.Client
	Cloud      *cloudclient.Client
	Group      *groupclient.Client
	Identity   *identityclient.Client
	Kv         *kvclient.Client
	Module     *moduleclient.Client
	Provision  *provisionclient.Client
	Auth       *authclient.Client
	Job        *jobclient.Client
	Matchmaker *matchmakerclient.Client
	Portal     *portalclient.Client
}

func NewClient(opts ...core.ClientOption) *Client {
	options := core.NewClientOptions()
	for _, opt := range opts {
		opt(options)
	}
	return &Client{
		baseURL:    options.BaseURL,
		caller:     core.NewCaller(options.HTTPClient),
		header:     options.ToHeader(),
		Admin:      adminclient.NewClient(opts...),
		Cloud:      cloudclient.NewClient(opts...),
		Group:      groupclient.NewClient(opts...),
		Identity:   identityclient.NewClient(opts...),
		Kv:         kvclient.NewClient(opts...),
		Module:     moduleclient.NewClient(opts...),
		Provision:  provisionclient.NewClient(opts...),
		Auth:       authclient.NewClient(opts...),
		Job:        jobclient.NewClient(opts...),
		Matchmaker: matchmakerclient.NewClient(opts...),
		Portal:     portalclient.NewClient(opts...),
	}
}
