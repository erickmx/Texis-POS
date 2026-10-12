package orders

import "math"

// IvaRate is the Mexican IVA rate applied to the taxable service fee only.
// gasto_terceros is a non-taxable third-party passthrough and is excluded.
const IvaRate = 0.16

// ComputeIvaCents returns the IVA over the service fee in integer cents.
func ComputeIvaCents(serviceCents int) int {
	return int(math.Round(float64(serviceCents) * IvaRate))
}

// ComputeTotalCents returns total = gasto_terceros + service_fee + IVA in
// integer cents. Integer cents avoid float drift before the final /100.
func ComputeTotalCents(gastoCents, serviceCents int) int {
	return gastoCents + serviceCents + ComputeIvaCents(serviceCents)
}

// dollarsToCents converts a nullable DECIMAL(10,2) amount to integer cents.
// Nil (absent) counts as 0, matching the UI derivation rule.
func dollarsToCents(v *float64) int {
	if v == nil {
		return 0
	}
	return int(math.Round(*v * 100))
}
