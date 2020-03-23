# Admin API

Non-public API for editing. These methods generally require authorisation.  
`*` = content-type must be `application/json`

## Lexemes

| Method   | URL            | Description                  | Payload*        | Return Value |
|:---------|:---------------|:-----------------------------|:----------------|:-------------|
| `GET`    | `/lexemes/`    | Index                        | -               | Documents    |
| `POST`   | `/lexemes/`    | Create                       | Entire document | Document     |
| `GET`    | `/lexemes/:id` | Read                         | -               | Document     |
| `POST`   | `/lexemes/:id` | Update                       | Entire document | Document     |
| `DELETE` | `/lexemes/:id` | Delete (including wordforms) | -               | -            |


## Wordforms

| Method   | URL                                         | Description                                                    | Payload*                                                   | Return Value        |
|:---------|:--------------------------------------------|:---------------------------------------------------------------|:-----------------------------------------------------------|:--------------------|
| `POST`   | `/wordforms/`                               | Create                                                         | Entire document                                            | Document            |
| `GET`    | `/wordforms/:id`                            | Read                                                           | -                                                          | Document            |
| `POST`   | `/wordforms/:id`                            | Update                                                         | Entire document                                            | Document            |
| `DELETE` | `/wordforms/:id`                            | Delete                                                         | -                                                          | -                   |
| `POST`   | `/wordforms/replace/:lexeme_id`             | Search/replace in wordforms                                    | `{search: (string), replace: (string), commit: (boolean)}` | Affected documents  |
| `POST`   | `/wordforms/generate/:paradigm/:lexeme_id?` | Generate inflections (`lexeme_id` is required when committing) | `{lemma: (string), commit: (boolean)}`                     | Generated documents |

## Roots

| Method   | URL                                           | Description | Payload*        | Return Value |
|:---------|:----------------------------------------------|:------------|:----------------|:-------------|
| `GET`    | `/roots/`                                     | Index       | -               | Documents    |
| `POST`   | `/roots/`                                     | Create      | Entire document | Document     |
| `GET`    | `/roots/:id` or `/roots/:radicals/:variants?` | Read        | -               | Document     |
| `POST`   | `/roots/:id`                                  | Update      | Entire document | Document     |
| `DELETE` | `/roots/:id`                                  | Delete      | -               | -            |

## Sources

| Method | URL             | Description | Payload* | Return Value |
|:-------|:----------------|:------------|:---------|:-------------|
| `GET`  | `/sources/`     | Index       | -        | Documents    |
| `GET`  | `/sources/:key` | Read        | -        | Document     |

## Feedback

| Method | URL                 | Description                         | Payload*                                                              | Return Value |
|:-------|:--------------------|:------------------------------------|:----------------------------------------------------------------------|:-------------|
| `GET`  | `/feedback/suggest` | Get pending suggestions (paged)     | -                                                                     | Documents    |
| `POST` | `/feedback/suggest` | Add suggestion (checks for matches) | Entire document (only the fields `lemma`, `gloss` and `pos` are used) | Document     |

## Logs

| Method | URL                     | Description                           | Return Value                |
|:-------|:------------------------|:--------------------------------------|:----------------------------|
| `GET`  | `/logs/:collection/:id` | Get history for document in collectin | List of log entry documents |
