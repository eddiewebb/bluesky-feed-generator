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

    const keywords = [ '#canna', 'adirondank', 'adirondackgreen','mmemberville',
      'grow tent','sea of green'," THC","terpenes","growmies","autoflower","#weedfeed","indoor grow"," kush "," rosin ","autopot"," sensimi"]
    const authors = new Map([
      ['did:plc:7zhjxd3sicg5nrd37mbq4bii', 'Wayne Growz'],
      ["did:plc:bpiga2nftqctnl7jaqyopud4", "cannabislover"],
      ["did:plc:sz3idvfudj7pb3bonh72yp3t", "Ceri Culitvates"],
      ["did:plc:467quzrmpl44zbnfmjdvup7s", "Heretic"],
      ["did:plc:unocmavm6j6xjaj24fblquu7", "Sunset cannafarm"],
      ["did:plc:znvvpl2hq7iift6w2fn3mbws", "Sweetgrass Cannabis"],
      ["did:plc:bd65k36gc35tukpk7vli7qez", "Breeder Steve"],
      ["did:plc:rls3kykgpddybnfrpxev6yiz", "apocalyptique420.bsky.social"],
      ["did:plc:wdaqisb2biywo4gsabzohgng", "mediamaster.bsky.social"],
      ["did:plc:r5mqpufe2emxw3rgvsdhptao", "cameraman2014.bsky.social"],
      ["did:plc:toxgpgrnjl4d4avtddr6padj", "pushinpetunias.bsky.social"]
    ])


    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        // only alf-related posts
        let lowered = create.record.text.toLowerCase();
        return authors.has(create.author) || keywords.some(element => lowered.includes(element)) 

        //record.embed: { '$type': 'app.bsky.embed.images', images: [Array] },
      })
      .map((create) => {
        // map alf-related posts to a db row
        console.log("matched post")
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
        console.log("Deleted %d posts", postsToDelete.length)
    }
    if (postsToCreate.length > 0) {
      await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
        console.log("created %d posts", postsToCreate.length)
    }
  }
}
