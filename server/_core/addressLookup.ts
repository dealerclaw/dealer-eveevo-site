import { ENV } from "./env";

interface AddressResult {
  line1: string;
  line2?: string;
  line3?: string;
  town: string;
  county?: string;
  postcode: string;
  fullAddress: string;
}

interface PostcodeLookupResponse {
  success: boolean;
  data?: {
    addresses?: Array<{
      line_1?: string;
      line_2?: string;
      line_3?: string;
      post_town?: string;
      county?: string;
      postcode?: string;
    }>;
  };
  message?: string;
}

/**
 * Lookup addresses by UK postcode using OneAuto API
 * Returns array of addresses matching the postcode
 */
export async function lookupAddressByPostcode(
  postcode: string
): Promise<AddressResult[]> {
  const apiKey = ENV.ONEAUTO_API_KEY;
  const baseUrl = ENV.ONEAUTO_API_URL;

  if (!apiKey || !baseUrl) {
    throw new Error("OneAuto API credentials not configured");
  }

  // Clean postcode (remove spaces, uppercase)
  const cleanPostcode = postcode.replace(/\s/g, "").toUpperCase();

  try {
    const url = `${baseUrl}?post_code=${encodeURIComponent(cleanPostcode)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Address lookup failed: ${response.status}`);
    }

    const result: PostcodeLookupResponse = await response.json();

    if (!result.success || !result.data?.addresses) {
      return [];
    }

    // Transform API response to our format
    return result.data.addresses.map((addr) => {
      const parts = [
        addr.line_1,
        addr.line_2,
        addr.line_3,
        addr.post_town,
        addr.county,
        addr.postcode,
      ].filter(Boolean);

      return {
        line1: addr.line_1 || "",
        line2: addr.line_2,
        line3: addr.line_3,
        town: addr.post_town || "",
        county: addr.county,
        postcode: addr.postcode || cleanPostcode,
        fullAddress: parts.join(", "),
      };
    });
  } catch (error) {
    console.error("OneAuto API error:", error);
    throw error;
  }
}
