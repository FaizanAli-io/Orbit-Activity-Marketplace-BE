import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Orbit Activity Marketplace API</title>
        <style>
          body {
            background: linear-gradient(135deg, #4f8cff 0%, #a6e1fa 100%);
            min-height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', Arial, sans-serif;
          }
          .container {
            background: rgba(255,255,255,0.95);
            border-radius: 18px;
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.2);
            padding: 48px 36px;
            text-align: center;
            max-width: 420px;
          }
          h1 {
            color: #2d3a4a;
            font-size: 2.2rem;
            margin-bottom: 0.5em;
            letter-spacing: 1px;
          }
          p {
            color: #4f8cff;
            font-size: 1.1rem;
            margin-top: 0;
            margin-bottom: 1.5em;
          }
          .link-box {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 1em;
          }
          .link {
            display: inline-block;
            padding: 10px 22px;
            background: #4f8cff;
            color: #fff;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            transition: background 0.2s;
          }
          .link:hover {
            background: #2563eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 Orbit Activity Marketplace API</h1>
          <p>Welcome to the Orbit Activity Marketplace API.<br>
          Explore the <b>API documentation</b> below to get started.</p>
          <div class="link-box">
            <a class="link" href="/docs" target="_blank">View API Docs</a>
            <a class="link" href="https://www.orbithk.com/" target="_blank">Visit Frontend</a>
          </div>
        </div>
      </body>
      </html>
    `.trim();
  }
}
