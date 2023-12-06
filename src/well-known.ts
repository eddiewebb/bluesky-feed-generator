import express from 'express'
import { resolve } from 'path'
import { AppContext } from './config'

const makeRouter = (ctx: AppContext) => {
  const router = express.Router()

  const handles = new Map([
    ["eddie","did:plc:r2jsoijmenfb67klwdc3hyav"]
  ])


  router.get('/.well-known/atproto-did', (req, res) => {
    const handle = req.headers['X-atproto-handle'];
    console.log(handle);
    if (typeof handle === "undefined") {
      res.status(404).send()
      return
    }

    const did = handles.get(handle[0]);
    res.type('text/plain').send('did');
  })



  router.get('/.well-known/did.json', (_req, res) => {
    if (!ctx.cfg.serviceDid.endsWith(ctx.cfg.hostname)) {
      return res.sendStatus(404)
    }
    res.json({
      '@context': ['https://www.w3.org/ns/did/v1'],
      id: ctx.cfg.serviceDid,
      service: [
        {
          id: '#bsky_fg',
          type: 'BskyFeedGenerator',
          serviceEndpoint: `https://${ctx.cfg.hostname}`,
        },
      ],
    })
  })

  return router
}
export default makeRouter
