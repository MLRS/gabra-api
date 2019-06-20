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

{{wordform.json}}

## Collection `roots`

{{root.json}}

## Collection `sources`

{{source.json}}

## Collection `logs`

{{log.json}}

**Note:** Because of a previous bug, the `collection` field may erroneously show 'lexemes' instead of 'wordforms', in particular for deletions.

## Universal POS tag set

See: <https://universaldependencies.org/u/pos/>

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
