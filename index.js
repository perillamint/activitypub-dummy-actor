const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

const acct_regexp = /acct:([^@]+)@([^@]+)/;
const actor_template = require('./actor-template.json');

app.use(bodyParser.json({ type: 'application/*+json' }));

app.post('/inbox', (req, res) => {
    console.log('/inbox');
    console.log(req.headers);
    console.log(JSON.stringify(req.body, null, 4));

    res.send(200);
});

app.post('/users/:username/inbox', (req, res) => {
    console.log(`POST /users/${req.params.username}/inbox`);
    console.log(req.headers);
    console.log(JSON.stringify(req.body, null, 4));

    res.send(200);
});

app.get('/.well-known/webfinger', (req, res) => {
    const resource = req.query.resource;

    if (resource == null) {
        res.status(400).send("Missing resource parameter");
        return;
    }

    const match = resource.match(acct_regexp);

    if (match == null || match.length != 3) {
        res.status(400).send("Invalid resource parameter");
    }

    const username = match[1];
    const domain = match[2];

    console.log(`[+] Webfinger request for: ${username}@${domain}.`);
    console.log(`[+] Serving webfinger request for: ${username}@${domain}.`);
    res.send({
        "subject": `acct:${username}@${domain}`,
        "aliases": [
            `https://${domain}/users/${username}`,
        ],
        "links": [
          {
              "rel": "self",
              "type": "application/activity+json",
              "href": `https://${domain}/users/${username}`,
          }
        ]
    });
});

app.get('/users/:username', (req, res) => {
    console.log(`[+] Actor request for: ${req.params.username}.`);
    let actor = JSON.parse(JSON.stringify(actor_template)); // Crudly deep clone the template

    actor.id = `https://${req.headers.host}/users/${req.params.username}`;
    actor.inbox = `https://${req.headers.host}/users/${req.params.username}/inbox`;
    actor.preferredUsername = `${req.params.username}`;
    actor.url = `https://${req.headers.host}/users/${req.params.username}`;
    actor.publicKey.id = `https://${req.headers.host}/users/${req.params.username}#main-key`;
    actor.publicKey.owner = `https://${req.headers.host}/users/${req.params.username}`;
    actor.endpoints.sharedInbox = `https://${req.headers.host}/inbox`;

    console.log(`[+] Serving actor request for: ${req.params.username}.`);
    res.send(actor);
});

app.listen(port, () => {
  console.log(`[+] Dummy ActivityPub actor app listening on port ${port}`)
});
