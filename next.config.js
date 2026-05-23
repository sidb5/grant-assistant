const fs = require('fs')
const path = require('path')

// Force .env.local values into process.env so they override any shell
// environment variables that Claude Code (or the OS) may have pre-set.
try {
  const envLocal = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8')
  envLocal.split(/\r?\n/).forEach(line => {
    const match = line.match(/^([^#][^=]*)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const val = match[2].trim()
      if (val) process.env[key] = val   // only overwrite if .env.local has a real value
    }
  })
} catch (_) {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer']
  },
  async headers() {
    return [
      {
        // Allow the Chrome extension (content scripts run on ncbi.nlm.nih.gov)
        // to call our API routes. The OPTIONS preflight and the actual request
        // both need these headers.
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
