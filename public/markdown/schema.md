# Database schema

This page describes the general schema of the Ġabra database.
Since the database is based on JSON, this is not a schema in the traditional sense; it is rather a set of guidelines for what fields can be contained in each collection.

- Internal `_id` fields are not included here.
- Items separated by commas ( **,** ) indicate example values.
- Items separated by slashes ( **/** ) indicate a set of allowed values.
- This document lists all _possible_ fields; most are optional and many entries will only a have subset of them.
- We treat a null field the same as a missing field.

## Collection `lexemes`

{{lexeme.json}}

## Collection `wordforms`

| Field        | Type                              | Description                                      | Example/allowed values                                                                                                                                                                                                                       |
|:-------------|:----------------------------------|:-------------------------------------------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| _id          | ObjectId                          |                                                  | ObjectId("522d85f86f3bad5137000989")                                                                                                                                                                                                         |
| lexeme_id    | ObjectId                          | Should be a valid ID in collection `lexemes`     |                                                                                                                                                                                                                                              |
| surface_form | String                            | Surface form                                     | "skrejjen"                                                                                                                                                                                                                                   |
| alternatives | [String]                          | List of spelling alternatives                    | ["doxxa", "duxxa"]                                                                                                                                                                                                                           |
| gloss        | String                            | English gloss (newline-separated)                |                                                                                                                                                                                                                                              |
| phonetic     | String                            |                                                  | "'skrɛjjɛn"                                                                                                                                                                                                                                  |
| pattern      | String                            | Vowel-consonant pattern                          | "CCVVCVC"                                                                                                                                                                                                                                    |
| sources      | [String]                          | Source keys                                      | ["Spagnol2011", "Falzon2013"]                                                                                                                                                                                                                |
| gender       | String                            |                                                  | m / f / mf (both genders)                                                                                                                                                                                                                    |
| number       | String                            |                                                  | sg (singular) <br> dl (dual) <br> sgv (singulative) <br> coll (collective) <br> sp (both sg and pl) <br> pl (plural) <br> pl_ind (indeterminate plural - probably not needed) <br> pl_det (determinate plural) <br> pl_pl (plural of plural) |
| plural_form  | String                            | Plural type                                      | counted                                                                                                                                                                                                                                      |
| possessor    | Object { person, number, gender } | Agreement for nouns which inflect for possessive | { person:"p3", number:"sg", gender:"m" }                                                                                                                                                                                                     |
| form         | String                            | General morphological form                       | comparative / superlative / diminutive / interrogative / mimated / verbalnoun                                                                                                                                                                |
| subject      | Object { person, number, gender } | Subject agreement (verbs)                        | { person:"p3", number:"sg", gender:"m" }                                                                                                                                                                                                     |
| dir_obj      | Object { person, number, gender } | Direct object agreement                          | { person:"p3", number:"pl" }                                                                                                                                                                                                                 |
| ind_obj      | Object { person, number, gender } | Indirect object agreement                        | { person:"p1", number:"pl" }                                                                                                                                                                                                                 |
| aspect       | String                            | Aspect (verbs)                                   | perf (perfective) / imp (imperative) / impf (imperfective) / pastpart / prespart                                                                                                                                                             |
| polarity     | String                            |                                                  | neg / pos                                                                                                                                                                                                                                    |
| generated    | Boolean                           | Was wordform auto-generated?                     | true                                                                                                                                                                                                                                         |
| hypothetical | Bool                              |                                                  |                                                                                                                                                                                                                                              |
| archaic      | Bool                              |                                                  |                                                                                                                                                                                                                                              |
| pending      | Boolean                           | Flagged as incorrect or new suggestion           |                                                                                                                                                                                                                                              |
| comment      | String                            | General comment                                  |                                                                                                                                                                                                                                              |

## Collection `roots`

| Field        | Type     | Description                                       | Example/allowed values                                                   |
|:-------------|:---------|:--------------------------------------------------|:-------------------------------------------------------------------------|
| _id          | ObjectId |                                                   | ObjectId("522d85f86f3bad5137000989")                                     |
| type         | String   | Root class                                        | strong / geminated / weak-initial / weak-medial / weak-final / irregular |
| variant      | Int      | To distinguish different roots with same radicals | 1-5                                                                      |
| radicals     | String   | Radicals separated with hyphens                   | "k-t-b" or "k-b-t-x"                                                     |
| alternatives | String   | Comma-separated root alternatives                 | "k-b-t"                                                                  |
| sources      | [String] | Source keys (all roots come from Spagnol2011)     | ["Spagnol2011"]                                                          |

## Collection `sources`

| Field  | Type     | Description       | Example/allowed values               |
|:-------|:---------|:------------------|:-------------------------------------|
| _id    | ObjectId |                   | ObjectId("522d85f86f3bad5137000989") |
| key    | String   |                   | "Spagnol2011"                        |
| author | String   | Full author name  |                                      |
| title  | String   | Title of resource |                                      |
| year   | Int      | Year of release   |                                      |
| note   | String   |                   |                                      |

## Collection `logs`

| Field      | Type     | Description                      | Example/allowed values               |
|:-----------|:---------|:---------------------------------|:-------------------------------------|
| _id        | ObjectId |                                  | ObjectId("522d85f86f3bad5137000989") |
| collection | String   |                                  | lexemes / wordforms / roots          |
| object_id  | ObjectId | Must be a valid ID in collection | ObjectId("522d85f86f3bad5137000489") |
| date       | Date     | Date/time of edit                | ISODate("2015-09-05T12:39:07.468Z")  |
| new_value  | Document | New document, if available       |                                      |
| action     | String   | Description of action            | created / modified / deleted         |
| username   | String   | Username of user making the edit | "john.camilleri"                     |
| ip         | String   | IP address                       | "192.168.0.1"                        |

- Because of a previous bug, the `collection` field may erroneously show 'lexemes' instead of 'wordforms', in particular for deletions.

## Universal POS tag set

See: <http://universaldependencies.github.io/docs/>

| Tag   | Description               |
|:------|:--------------------------|
| ADJ   | adjective                 |
| ADP   | adposition                |
| ADV   | adverb                    |
| AUX   | auxiliary verb            |
| CONJ  | coordinating conjunction  |
| DET   | determiner                |
| INTJ  | interjection              |
| NOUN  | noun                      |
| NUM   | numeral                   |
| PART  | particle                  |
| PRON  | pronoun                   |
| PROPN | proper noun               |
| PUNCT | punctuation               |
| SCONJ | subordinating conjunction |
| SYM   | symbol                    |
| VERB  | verb                      |
| X     | other                     |
