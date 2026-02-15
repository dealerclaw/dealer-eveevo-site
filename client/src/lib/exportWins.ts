/**
 * Export wins to CSV format
 */
export function exportWinsToCSV(wins: any[]) {
  const headers = [
    'Won Date',
    'Vehicle',
    'Year',
    'Mileage',
    'Condition',
    'Winning Bid',
    'Commitment Fee',
    'Balance Due',
    'Payment Status',
    'Paid Date',
    'Inspection Scheduled',
    'Seller',
    'Seller Phone',
    'Seller Email',
  ];

  const rows = wins.map((item: any) => {
    const win = item.bid;
    const car = item.car;
    
    return [
      new Date(win.createdAt).toLocaleDateString('en-GB'),
      `${car?.make || ''} ${car?.model || ''}`,
      car?.year || '',
      car?.mileage || '',
      car?.condition || '',
      `£${parseFloat(win.bidAmount).toFixed(2)}`,
      '£99.00',
      `£${(parseFloat(win.bidAmount) - 99).toFixed(2)}`,
      win.paymentStatus === 'paid' ? 'Paid' : 'Pending',
      win.paidAt ? new Date(win.paidAt).toLocaleDateString('en-GB') : '',
      win.inspectionScheduledAt ? new Date(win.inspectionScheduledAt).toLocaleString('en-GB') : '',
      car?.dealerName || '',
      car?.dealerPhone || '',
      car?.dealerEmail || '',
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `auction-wins-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export wins to PDF format (using browser print)
 */
export function exportWinsToPDF(wins: any[]) {
  // Create a printable HTML document
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window. Please allow popups.');
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Auction Wins Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        h1 {
          color: #333;
          border-bottom: 2px solid #4CAF50;
          padding-bottom: 10px;
        }
        .meta {
          color: #666;
          margin-bottom: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th {
          background-color: #4CAF50;
          color: white;
        }
        tr:nth-child(even) {
          background-color: #f2f2f2;
        }
        .paid {
          color: #4CAF50;
          font-weight: bold;
        }
        .pending {
          color: #ff9800;
          font-weight: bold;
        }
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <h1>Auction Wins Report</h1>
      <div class="meta">
        <p><strong>Generated:</strong> ${new Date().toLocaleString('en-GB')}</p>
        <p><strong>Total Wins:</strong> ${wins.length}</p>
        <p><strong>Total Value:</strong> £${wins.reduce((sum: number, item: any) => sum + parseFloat(item.bid.bidAmount), 0).toLocaleString()}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Vehicle</th>
            <th>Winning Bid</th>
            <th>Payment</th>
            <th>Seller</th>
          </tr>
        </thead>
        <tbody>
          ${wins.map((item: any) => {
            const win = item.bid;
            const car = item.car;
            return `
              <tr>
                <td>${new Date(win.createdAt).toLocaleDateString('en-GB')}</td>
                <td>${car?.make || ''} ${car?.model || ''} ${car?.year || ''}<br/>
                    <small>${car?.mileage?.toLocaleString() || ''} miles | ${car?.condition || ''}</small>
                </td>
                <td>£${parseFloat(win.bidAmount).toLocaleString()}<br/>
                    <small>Balance: £${(parseFloat(win.bidAmount) - 99).toLocaleString()}</small>
                </td>
                <td class="${win.paymentStatus === 'paid' ? 'paid' : 'pending'}">
                  ${win.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}<br/>
                  ${win.paidAt ? `<small>${new Date(win.paidAt).toLocaleDateString('en-GB')}</small>` : ''}
                </td>
                <td>${car?.dealerName || ''}<br/>
                    <small>${car?.dealerPhone || ''}</small>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Wait for content to load then trigger print
  printWindow.onload = () => {
    printWindow.print();
  };
}
