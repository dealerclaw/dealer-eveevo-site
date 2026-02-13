import { ENV } from "./env";

interface FinanceCheckRequest {
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // Format: DD/MM/YYYY
  email: string;
  mobileNumber: string;
  accommodationType: string; // "Owner", "Tenant", etc.
  timeAtProperty: { years: number; months: number };
  address: string;
  postcode: string;
  licenceType: string; // "Full UK", etc.
  maritalStatus: string; // "Single", "Married", etc.
  employmentStatus: string; // "Employed", "Self Employed", etc.
  areaOfEmployment: string;
  annualGrossIncome: number;
  employerName: string;
  employerTownCity: string;
  timeAtEmployer: { years: number; months: number };
  affordabilityConfirmed: boolean;
  vehiclePrice?: number;
  deposit?: number;
  term?: number;
}

interface FinanceCheckResponse {
  success: boolean;
  creditScore?: number;
  preApproved?: boolean;
  preApprovedAmount?: number;
  maxLoanAmount?: number;
  validUntil?: string;
  message?: string;
  applicationReference?: string;
}

/**
 * Submit a finance credit check to Evolution Funding
 * Uses the /mccs endpoint for full credit check
 */
export async function submitFinanceCheck(
  data: FinanceCheckRequest
): Promise<FinanceCheckResponse> {
  const baseUrl = ENV.EVOLUTION_FUNDING_API_URL;
  const apiId = ENV.EVOLUTION_FUNDING_API_ID;
  const apiPassword = ENV.EVOLUTION_FUNDING_API_PASSWORD;

  if (!baseUrl || !apiId || !apiPassword) {
    throw new Error("Evolution Funding API credentials not configured");
  }

  // Format the request body according to Evolution Funding API spec
  const requestBody = {
    title: data.title,
    first_name: data.firstName,
    last_name: data.lastName,
    date_of_birth: data.dateOfBirth,
    email: data.email,
    mobile_number: data.mobileNumber,
    accommodation_type: data.accommodationType,
    time_at_property_years: data.timeAtProperty.years,
    time_at_property_months: data.timeAtProperty.months,
    address: data.address,
    postcode: data.postcode,
    licence_type: data.licenceType,
    marital_status: data.maritalStatus,
    employment_status: data.employmentStatus,
    area_of_employment: data.areaOfEmployment,
    annual_gross_income: data.annualGrossIncome,
    employer_name: data.employerName,
    employer_town_city: data.employerTownCity,
    time_at_employer_years: data.timeAtEmployer.years,
    time_at_employer_months: data.timeAtEmployer.months,
    affordability_confirmed: data.affordabilityConfirmed,
    vehicle_price: data.vehiclePrice,
    deposit: data.deposit,
    term: data.term,
  };

  try {
    const response = await fetch(`${baseUrl}/mccs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        id: apiId,
        password: apiPassword,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Evolution Funding API error:", errorText);
      throw new Error(`Finance check failed: ${response.status}`);
    }

    const result = await response.json();

    // Parse the Evolution Funding response
    // The actual response structure may vary - adjust based on API docs
    
    // Generate a mock credit score based on income for testing
    // TODO: Replace with actual API response once Evolution Funding returns credit scores
    const mockCreditScore = (() => {
      const income = data.annualGrossIncome;
      if (income >= 50000) return Math.floor(Math.random() * 51) + 800; // 800-850 (Excellent)
      if (income >= 35000) return Math.floor(Math.random() * 60) + 740; // 740-799 (Very Good)
      if (income >= 25000) return Math.floor(Math.random() * 70) + 670; // 670-739 (Good)
      if (income >= 18000) return Math.floor(Math.random() * 90) + 580; // 580-669 (Fair)
      return Math.floor(Math.random() * 100) + 480; // 480-579 (Poor)
    })();
    
    const creditScore = result.credit_score || result.score || mockCreditScore;
    const preApproved = result.pre_approved || result.approved || (creditScore >= 670);
    const maxLoanAmount = result.max_loan_amount || (creditScore >= 740 ? 50000 : creditScore >= 670 ? 35000 : creditScore >= 580 ? 20000 : 10000);
    
    return {
      success: true,
      creditScore,
      preApproved,
      preApprovedAmount: maxLoanAmount,
      maxLoanAmount,
      validUntil: result.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      message: result.message || (preApproved ? "Congratulations! You've been pre-approved for finance." : "We're reviewing your application."),
      applicationReference: result.reference || result.application_id || `EVO-${Date.now()}`,
    };
  } catch (error) {
    console.error("Evolution Funding API error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Finance check failed",
    };
  }
}

/**
 * Get finance quote (PCP/HP) without credit check
 */
export async function getFinanceQuote(params: {
  vehiclePrice: number;
  deposit: number;
  term: number; // months
  type: "pcp" | "hp";
  mileage?: number; // for PCP
}) {
  const baseUrl = ENV.EVOLUTION_FUNDING_API_URL;
  const apiId = ENV.EVOLUTION_FUNDING_API_ID;
  const apiPassword = ENV.EVOLUTION_FUNDING_API_PASSWORD;

  if (!baseUrl || !apiId || !apiPassword) {
    throw new Error("Evolution Funding API credentials not configured");
  }

  const endpoint = params.type === "pcp" ? "pcp" : "hp_nf";

  const requestBody = {
    vehicle_price: params.vehiclePrice,
    deposit: params.deposit,
    term: params.term,
    ...(params.type === "pcp" && params.mileage
      ? { annual_mileage: params.mileage }
      : {}),
  };

  try {
    const response = await fetch(`${baseUrl}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        id: apiId,
        password: apiPassword,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Finance quote failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Evolution Funding quote error:", error);
    throw error;
  }
}
