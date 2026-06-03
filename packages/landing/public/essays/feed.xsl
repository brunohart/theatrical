<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/rss/channel">
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title><xsl:value-of select="title"/> · RSS</title>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&amp;family=Inter:wght@400;500&amp;family=JetBrains+Mono:wght@500&amp;display=swap" rel="stylesheet"/>
        <style>
          :root{--bg:#F0EDE6;--ink:#1A1A1A;--navy:#1B2D4F;--orange:#D4622B;--grey:#6E6A60;--line:#D8D2C6;}
          *{box-sizing:border-box;}
          body{margin:0;background:var(--bg);color:var(--ink);font-family:'Inter',-apple-system,sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased;}
          .wrap{max-width:680px;margin:0 auto;padding:64px 24px 96px;}
          .badge{display:inline-flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:var(--orange);}
          .badge .dot{width:7px;height:7px;border-radius:50%;background:var(--orange);}
          h1{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:clamp(2rem,6vw,2.8rem);letter-spacing:-0.03em;line-height:1.05;margin:18px 0 10px;}
          .lede{color:var(--grey);font-size:1.05rem;margin:0 0 22px;}
          .hint{font-size:0.9rem;color:var(--navy);background:rgba(27,45,79,0.06);border:1px solid var(--line);border-radius:10px;padding:12px 16px;margin:0 0 40px;}
          .hint code{font-family:'JetBrains Mono',monospace;font-size:0.82rem;}
          ul{list-style:none;margin:0;padding:0;}
          li{padding:22px 0;border-top:1px solid var(--line);}
          li:last-child{border-bottom:1px solid var(--line);}
          a.t{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:1.3rem;letter-spacing:-0.02em;color:var(--ink);text-decoration:none;}
          a.t:hover{color:var(--orange);}
          .d{color:var(--grey);margin:6px 0 8px;}
          .date{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.08em;color:var(--grey);text-transform:uppercase;}
          .foot{margin-top:44px;font-family:'JetBrains Mono',monospace;font-size:13px;}
          .foot a{color:var(--orange);text-decoration:none;}
        </style>
      </head>
      <body>
        <div class="wrap">
          <span class="badge"><span class="dot"></span>RSS Feed</span>
          <h1><xsl:value-of select="title"/></h1>
          <p class="lede"><xsl:value-of select="description"/></p>
          <p class="hint">This is a live RSS feed. Copy this page's URL into your feed reader to subscribe — new essays appear automatically. The articles below are what's in the feed right now.</p>
          <ul>
            <xsl:for-each select="item">
              <li>
                <a class="t"><xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute><xsl:value-of select="title"/></a>
                <p class="d"><xsl:value-of select="description"/></p>
                <span class="date"><xsl:value-of select="pubDate"/></span>
              </li>
            </xsl:for-each>
          </ul>
          <p class="foot"><a href="/">← back to theatrical.dev</a></p>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
