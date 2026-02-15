import { sendEmail } from "./email";
import * as db from "./db";

export interface ShortlistNotification {
  dealerId: number;
  carId: number;
  type: 'price_drop' | 'inspection_report';
  oldPrice?: number;
  newPrice?: number;
  reportUrl?: string;
}

export async function notifyShortlistPriceChange(carId: number, oldPrice: number, newPrice: number) {
  // This would be called when a car price is updated
  // For now, we'll implement a simple check system
  
  // In a real implementation, you'd:
  // 1. Track which dealers have this car in their shortlist (via localStorage tracking or DB table)
  // 2. Send notifications to those dealers
  
  console.log(`[Shortlist] Price changed for car ${carId}: £${oldPrice} → £${newPrice}`);
  
  // Example notification logic (would need actual dealer tracking):
  // const notification = {
  //   type: 'price_drop' as const,
  //   carId,
  //   oldPrice,
  //   newPrice,
  // };
  
  // await sendShortlistNotification(dealerId, notification);
}

export async function notifyShortlistInspectionReport(carId: number, reportUrl: string) {
  console.log(`[Shortlist] New inspection report for car ${carId}: ${reportUrl}`);
  
  // Similar logic - would notify dealers who have this car shortlisted
}

export async function sendShortlistNotification(
  dealerEmail: string,
  dealerName: string,
  notification: ShortlistNotification
) {
  const car = await db.getCarById(notification.carId);
  if (!car) return;

  let subject = '';
  let htmlContent = '';

  if (notification.type === 'price_drop') {
    const savings = (notification.oldPrice || 0) - (notification.newPrice || 0);
    subject = `Price Drop Alert: ${car.year} ${car.make} ${car.model}`;
    htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #86efac 0%, #4ade80 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .price-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4ade80; }
          .old-price { text-decoration: line-through; color: #999; font-size: 18px; }
          .new-price { color: #16a34a; font-size: 32px; font-weight: bold; }
          .savings { color: #16a34a; font-size: 20px; font-weight: bold; margin-top: 10px; }
          .button { display: inline-block; background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Price Drop Alert!</h1>
          </div>
          <div class="content">
            <p>Hi ${dealerName},</p>
            <p>Great news! A vehicle on your shortlist has dropped in price:</p>
            
            <div class="price-box">
              <h2>${car.year} ${car.make} ${car.model}</h2>
              <p>${car.mileage?.toLocaleString()} miles • ${car.condition}</p>
              
              <div style="margin-top: 15px;">
                <div class="old-price">Was: £${notification.oldPrice?.toLocaleString()}</div>
                <div class="new-price">Now: £${notification.newPrice?.toLocaleString()}</div>
                <div class="savings">Save £${savings.toLocaleString()}!</div>
              </div>
            </div>

            <p>This vehicle won't stay at this price for long. View the full details and make an offer before it's gone!</p>

            <a href="${process.env.VITE_APP_URL || 'https://eveevo.com'}/dealer/marketplace/${car.id}" class="button">
              View Vehicle Details
            </a>

            <div class="footer">
              <p>You're receiving this because you added this vehicle to your shortlist.</p>
              <p>EVEEVO - Smart, Easy, Electric EVs</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  } else if (notification.type === 'inspection_report') {
    subject = `New Inspection Report: ${car.year} ${car.make} ${car.model}`;
    htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #86efac 0%, #4ade80 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .report-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 New Inspection Report Available</h1>
          </div>
          <div class="content">
            <p>Hi ${dealerName},</p>
            <p>A new inspection report has been uploaded for a vehicle on your shortlist:</p>
            
            <div class="report-box">
              <h2>${car.year} ${car.make} ${car.model}</h2>
              <p>${car.mileage?.toLocaleString()} miles • ${car.condition}</p>
              <p style="margin-top: 15px;">
                <strong>Report Type:</strong> HPI Check & Battery Health Certificate
              </p>
            </div>

            <p>Review the inspection report to make an informed purchasing decision.</p>

            <a href="${process.env.VITE_APP_URL || 'https://eveevo.com'}/dealer/marketplace/${car.id}" class="button">
              View Report & Vehicle Details
            </a>

            <div class="footer">
              <p>You're receiving this because you added this vehicle to your shortlist.</p>
              <p>EVEEVO - Smart, Easy, Electric EVs</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  try {
    await sendEmail({
      to: dealerEmail,
      subject,
      html: htmlContent,
    });
    console.log(`[Shortlist] Notification sent to ${dealerEmail}`);
  } catch (error) {
    console.error(`[Shortlist] Failed to send notification:`, error);
  }
}
