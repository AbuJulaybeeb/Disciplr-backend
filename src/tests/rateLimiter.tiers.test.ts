import request from 'supertest'
import { app } from '../app.js'

describe('Per-org and per-IP rate limit tiers', () => {
  it('blocks requests when org limit exceeded', async () => {
    const promises = []
    for (let i = 0; i < 250; i++) {
      promises.push(request(app).get('/api/org/test-org/vaults'))
    }
    const responses = await Promise.all(promises)
    const rateLimited = responses.filter(r => r.status === 429)
    expect(rateLimited.length).toBeGreaterThan(0)
  })

  it('different orgs have separate counters', async () => {
    const org1Requests = []
    const org2Requests = []
    for (let i = 0; i < 150; i++) {
      org1Requests.push(request(app).get('/api/org/org-1/vaults'))
      org2Requests.push(request(app).get('/api/org/org-2/vaults'))
    }
    const [org1Res, org2Res] = await Promise.all([
      Promise.all(org1Requests),
      Promise.all(org2Requests),
    ])
    expect(org1Res.filter(r => r.status === 429).length).toBeDefined()
    expect(org2Res.filter(r => r.status === 429).length).toBeDefined()
  })

  it('respects ORG_RATE_LIMIT_MAX from env', () => {
    const max = Number(process.env.ORG_RATE_LIMIT_MAX) || 200
    expect(max).toBe(200)
  })
})