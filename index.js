const core = require('@actions/core');
const github = require('@actions/github');
const Airtable = require('airtable');
const r = require('ramda');

async function run() {
  try {
    const airtableToken = core.getInput('airtable-token')
    const airtableBase = core.getInput('airtable-base')
    const airtableSheet = core.getInput('airtable-sheet')
    const airtablePicks = JSON.parse(core.getInput('airtable-picks') || '[["url"], ["title"], ["created_at"], ["merged_at"], ["labels"], ["comments"], ["review_comments"], ["commits"], ["additions"], ["deletions"], ["changed_files"]]')

    const now = new Date()
    const base = new Airtable({apiKey: airtableToken}).base(airtableBase);
    const picks = r.paths(airtablePicks, github.context.payload.pull_request)

    const paths = r.map(p => p.join('.'), airtablePicks)
    const payload = r.zipObj(paths, picks)
    base(airtableSheet).create(payload, {typecast: true}, function(err, record) {
      if (err) {
        core.setFailed(err.message);
      } else {
        core.debug(payload)
        core.setOutput('id', record.getId());
      }
    })
  } 
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
