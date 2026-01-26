package deploy

import (
	"fmt"
	"net"
	"strings"
)

var privateRanges = []*net.IPNet{
	mustCIDR("127.0.0.0/8"),
	mustCIDR("10.0.0.0/8"),
	mustCIDR("172.16.0.0/12"),
	mustCIDR("192.168.0.0/16"),
	mustCIDR("169.254.0.0/16"),
	mustCIDR("::1/128"),
	mustCIDR("fc00::/7"),
	mustCIDR("fe80::/10"),
}

func mustCIDR(cidr string) *net.IPNet {
	_, block, _ := net.ParseCIDR(cidr)
	return block
}

func ValidateHost(host string) error {
	trimmed := strings.TrimSpace(host)
	if trimmed == "" {
		return fmt.Errorf("host is required")
	}
	if strings.EqualFold(trimmed, "localhost") {
		return fmt.Errorf("localhost is not allowed")
	}

	if ip := net.ParseIP(trimmed); ip != nil {
		if isPrivateIP(ip) {
			return fmt.Errorf("private or loopback addresses are not allowed")
		}
		return nil
	}

	ips, err := net.LookupIP(trimmed)
	if err != nil {
		return fmt.Errorf("failed to resolve host")
	}
	for _, ip := range ips {
		if isPrivateIP(ip) {
			return fmt.Errorf("host resolves to private or loopback address")
		}
	}
	return nil
}

func isPrivateIP(ip net.IP) bool {
	if ip == nil {
		return true
	}
	if ip.IsLoopback() || ip.IsUnspecified() || ip.IsMulticast() || ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() {
		return true
	}
	for _, block := range privateRanges {
		if block.Contains(ip) {
			return true
		}
	}
	return false
}
