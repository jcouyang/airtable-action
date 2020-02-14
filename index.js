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
    const airtableTraversal = JSON.parse(core.getInput('airtable-traversal') || '{"labels": ["name"]}')
    const now = new Date()
    const event = github.context.payload.pull_request
    // const event = {"url":"https://api.github.com/repos/jcouyang/airtable-action/pulls/1","title":"V1 Release Test","created_at":"2020-02-13T10:22:10Z","merged_at":null,"labels":[{"color":"0075ca","default":true,"description":"Improvements or additions to documentation","id":1844823136,"name":"documentation","node_id":"MDU6TGFiZWwxODQ0ODIzMTM2","url":"https://api.github.com/repos/jcouyang/airtable-action/labels/documentation"},{"color":"a2eeef","default":true,"description":"New feature or request","id":1844823142,"name":"enhancement","node_id":"MDU6TGFiZWwxODQ0ODIzMTQy","url":"https://api.github.com/repos/jcouyang/airtable-action/labels/enhancement"}],"comments":0,"review_comments":0,"commits":9,"additions":83354,"deletions":309,"changed_files":5}
    const picks = r.paths(airtablePicks, event)

    const paths = r.map(p => p.join('.'), airtablePicks)
    const payload = r.mapObjIndexed((_,key, obj)=> {
      let p = airtableTraversal[key]
      if(p) return obj[key].map(r.path(p))
      else return obj[key]
    })(r.zipObj(paths, picks))

    const base = new Airtable({apiKey: airtableToken}).base(airtableBase);
    core.debug(JSON.stringify(payload));
    base(airtableSheet).create(payload, {typecast: true}, function(err, record) {
      if (err) {
        core.setFailed(err.message);
      } else {
        core.setOutput('id', record.getId());
      }
    })
  } 
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
