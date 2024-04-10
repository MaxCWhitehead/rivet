// This file was auto-generated by Fern from our API Definition.

package admin

import (
	fmt "fmt"
)

type PoolType string

const (
	PoolTypeJob PoolType = "job"
	PoolTypeGg  PoolType = "gg"
	PoolTypeAts PoolType = "ats"
)

func NewPoolTypeFromString(s string) (PoolType, error) {
	switch s {
	case "job":
		return PoolTypeJob, nil
	case "gg":
		return PoolTypeGg, nil
	case "ats":
		return PoolTypeAts, nil
	}
	var t PoolType
	return "", fmt.Errorf("%s is not a valid %T", s, t)
}

func (p PoolType) Ptr() *PoolType {
	return &p
}
