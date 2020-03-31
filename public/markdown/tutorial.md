# Tutorial for content editors

## 1. Two websites, one database

**[Ġabra](http://mlrs.research.um.edu.mt/resources/gabra/)** is the main site which is intended for normal users.  
**[Ġabra API](http://mlrs.research.um.edu.mt/resources/gabra-api/)** (this site) contains information about the technical aspects of the Ġabra database, including how to access it via the API and the structure of the data.

All the editing features are here on the API site.
It is important to realise that both sites are **using the same database**, so any content you change here will also be changed on the main Ġabra site too.

## 2. Structure

The first thing to understand is the difference between a **lexeme** and a **wordform**.

### Lexeme

A _lexeme_ is a lexical unit which corresponds to an entry in a dictionary.
Some features that belong to lexemes are `lemma`, `pos` (part of speech), `root`, and `gloss` (in English).
Every lexeme has an ID (field name `_id`), such as `5200a366e36f237975000f26`.

### Wordform

A lexeme has multiple _wordforms_, which represent inflectional forms of the lexeme.
Each wordform also has its own ID, and is linked to the parent lexeme via the `lexeme_id` field.
Some features that belong to wordforms are `surface_form`, `number`, `gender`, `aspect`, and `polarity`.

In general, every lexeme should have a wordform whose surface form is the same as the lemma of the lexeme.
For example, the lexeme with lemma _"ktieb"_ will have two associated wordforms, one with surface form _"ktieb"_ and another with surface form _"kotba"_.
Thus the string _"ktieb"_ is actually stored in two places, but the feature information (e.g. `number: sg` and `gender: m`) is only stored at the wordform level.

Some lexemes don't have any associated wordforms.
This is usually becuase no one has filled them in yet.
The only case where it's ok not to have any wordforms is for lexemes without any inflectional forms, e.g. exclamations such as _"illallu"_.

Some fields may occur in both lexeme and wordform, e.g. `alternatives` (for spelling variants) and `sources`.

Most fields are optional and you will notice that some entries seem to have more feature information
than others. This is just a result of the heterogenous nature of the data which we have; missing data is common.

<div class="alert alert-info">
For details about the fields we are currently using, see the <a href="#{pageURL}/schema">schema</a> page.
This page should be updated whenever we introduce a new field.
</div>

### Roots

Roots are identified by their radicals using the following format: `k-t-b` (triliteral) or `k-n-t-j` (quadriliteral).
In cases where the same root has different meanings, the `variant` number distinguishes these, e.g. `għ-r-q 1` ("sink") and `għ-r-q 2` ("sweat").
There is a separate collection in the database for roots, although this is a closed list and should not need to be modified.
In addition, roots are not linked to lexemes by ID in the way that wordforms are.
The root details of a lexeme are stored directly in it (this means there is a little data duplication).

## 3. Searching

You can search the database from both sites.
On the Ġabra site the interface is a little nicer, whereas here you will see a more raw view of the data.

### Sort order

The order in the search results does not follow the Maltese alphabet correctly — the characters _ċ, ġ, ħ, ż_ are sorted after _z_.
Also, lemmas beginning with upper-case appear before lower-cased ones.

### Pending entries

On the API site you will also see pending user suggestions in the main results (look out for `pending: true`).
These are created when users don't find what they are looking for and add their search as a suggestion.
These are not included in the normal search by default since they require moderation.

Notice that there will be some amount of junk here, which should just be deleted immediately.
There are also some duplicates within the pending entries.
Often users search incorrectly and think their query is not in Ġabra when it actually is.
This is usually due to not using Maltese characters, differences in uppper/lower case, and missing inflections.

Thus when reviewing pending entries, you should **always perform the search yourself** in order to decide whether the entry already exists or not.

## 4. Adding & editing entries

If you are logged in on the Ġabra API site, when searching you will see an **Edit** button
<button class="btn btn-sm btn-outline-warning border-0"><i class="fas fa-pen"></i></button>
next to each lexeme and its wordforms.

From the edit page you can make changes to an entry using the **JSON Editor**.

### JSON Editor

You can live-test the JSON editor below:

<div class="row">
<div class="col-6">

<div id="editor"></div>
<script src="#{baseURL}/module/@json-editor/json-editor/dist/jsoneditor.js"></script>
<script src="#{baseURL}/javascripts/tutorial.js"></script>

</div>
<div class="col-6 pt-5">

#### Add a known field

1. Click the <button class="btn btn-sm btn-secondary"><i class="fas fa-list"></i> Properties</button> button
2. Scroll to find the field you want to add
3. Sheck the checkbox beside the field name
4. Click <button class="btn btn-sm btn-secondary"><i class="fas fa-list"></i> Properties</button> again to close the box

#### Add an unknown field

If you want to add a completely new field (this should be discussed first!):

1. Click the <button class="btn btn-sm btn-secondary"><i class="fas fa-list"></i> Properties</button> button
2. Fill in the _name_ of the field where it says "Property name..." (e.g. `number`)
3. Click <button class="btn btn-sm btn-secondary"><i class="fas fa-plus"></i> add</button>
4. Click <button class="btn btn-sm btn-secondary"><i class="fas fa-list"></i> Properties</button> again to close the box
5. Change the _type_ of the field from `null`; normally you should choose `string`
6. Fill in the _value_ of the field (e.g. `pl` for plural)

#### Removing a field

1. Click the <button class="btn btn-sm btn-secondary"><i class="fas fa-list"></i> Properties</button> button
2. Scroll to find the field you want to add
3. Uncheck the checkbox beside the field name
4. Click <button class="btn btn-sm btn-secondary"><i class="fas fa-list"></i> Properties</button> again to close the box

#### Expanding/collapsing complex fields

Complex fields like `root` and `sources` can be hidden to reduce clutter.
Look out for the
<button class="btn btn-sm btn-secondary"><i class="fas fa-caret-right"></i></button>
and
<button class="btn btn-sm btn-secondary"><i class="fas fa-caret-down"></i></button>
buttons.

#### Edit JSON directly

If you know what you're doing and prefer to edit the data in JSON format directly,
you can do so by clicking the <button class="btn btn-sm btn-secondary"><i class="fas fa-pen"></i> JSON</button> button.

</div>
</div>

### Bulk replace

When it comes to editing wordforms, you can make changes to many surface forms at once by using search & replace.
This is useful when there are many wordforms with systematic errors (e.g. in verb conjugations).

1. Click the Search and Reaplce button <button class="btn btn-sm btn-warning"><i class="fas fa-retweet"></i></button>.
2. Enter the search string (the string to be replaced). This can be any regular expression. Try to be as specific as possible.
3. Enter the replace string (the string that will be inserted instead of the search string). You can reference captured groups from the search regexp with `$1` etc.
4. Click the <button class="btn btn-sm btn-primary"><i class="fas fa-check"></i> Test</button> button to preview the results.
5. **If you are completely sure** that the replacement is correct, click <button class="btn btn-sm btn-success"><i class="fas fa-save"></i> Commit</button>
   These changes are non-reversible, so please be careful when using this feature!

### View edit history

All edits made (after 2015-09-06) are logged and can be viewed by clicking the History button
<button class="btn btn-sm btn-outline-info border-0"><i class="fas fa-history"></i></button>
next to lexemes and wordforms.

### Delete

A lexeme or wordform can be deleted by clicking the
<button class="btn btn-sm btn-outline-danger border-0"><i class="fas fa-times"></i></button>
beside it.
When a lexeme is deleted, all its wordforms are also deleted.
