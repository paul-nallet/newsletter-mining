export function wrapEmailHtml(body: string, options?: { preheader?: string }): string {
  const preheader = options?.preheader
    ? `<span style="display:none;font-size:1px;color:#fff;max-height:0;overflow:hidden">${options.preheader}</span>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ScopeSight</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5">
    <tr>
      <td align="center" style="padding:32px 16px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:24px">
              <span style="font-size:20px;font-weight:700;color:#18181b">ScopeSight</span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:8px;padding:32px;color:#18181b;font-size:15px;line-height:1.6">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;font-size:12px;color:#a1a1aa">
              ScopeSight &mdash; Your newsletter intelligence platform
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
