import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return
    const ops = await getOpsByType(evt)

    // This logs the text of every post off the firehose.
    // Just for fun :)
    // Delete before actually using
    //for (const post of ops.posts.creates) {
    //  console.log(post)
    //}

    const keywords = ['cannabis', '#canna', 'adirondank', 'adirondackgreen','mmemberville','grow tent','sea of green','scrog',"THC","terpenes"]
    const authors = new Map([
      ['did:plc:7zhjxd3sicg5nrd37mbq4bii', 'Wayne Growz'],
      ["did:plc:bpiga2nftqctnl7jaqyopud4", "cannabislover"],
      ["did:plc:sz3idvfudj7pb3bonh72yp3t", "Ceri Culitvates"],
      ["did:plc:467quzrmpl44zbnfmjdvup7s", "Heretic"],
      ["did:plc:unocmavm6j6xjaj24fblquu7", "Sunset cannafarm"]
    ])


    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        // only alf-related posts
        let lowered = create.record.text.toLowerCase();
        return keywords.some(element => lowered.includes(element)) || authors.has(create.author)
      })
      .map((create) => {
        // map alf-related posts to a db row
        //console.log("Match")
        return {
          uri: create.uri,
          cid: create.cid,
          replyParent: create.record?.reply?.parent.uri ?? null,
          replyRoot: create.record?.reply?.root.uri ?? null,
          indexedAt: new Date().toISOString(),
        }
      })

    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
    }
    if (postsToCreate.length > 0) {
      await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
    }
  }
}
