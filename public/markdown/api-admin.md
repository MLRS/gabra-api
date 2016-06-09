# Admin API

Non-public API for editing. These methods generally require authorisation.  
`*` = content-type must be `application/json`

## Lexemes

| Method   | URL            | Description | Payload*        | Return Value |
|----------|----------------|-------------|-----------------|--------------|
| `POST`   | `/lexemes/`    | Create      | Entire document | Document     |
| `GET`    | `/lexemes/:id` | Read        | -               | Document     |
| `POST`   | `/lexemes/:id` | Update      | Entire document | Document     |
| `DELETE` | `/lexemes/:id` | Delete (including wordforms)  | - | -        |


## Wordforms

| Method   | URL              | Description | Payload*        | Return Value |
|----------|------------------|-------------|-----------------|--------------|
| `POST`   | `/wordforms/`    | Create      | Entire document | Document     |
| `GET`    | `/wordforms/:id` | Read        | -               | Document     |
| `POST`   | `/wordforms/:id` | Update      | Entire document | Document     |
| `DELETE` | `/wordforms/:id` | Delete      | -               | -            |
| `POST`   | `/wordforms/replace/:lexeme_id` | Search/replace in wordforms | `{search: (regex), replace: (string), commit: boolean}` | List of affected documents |

## Roots

| Method   | URL          | Description | Payload*        | Return Value |
|----------|--------------|-------------|-----------------|--------------|
| `GET`    | `/roots/`    | Index       | -               | Documents    |
| `POST`   | `/roots/`    | Create      | Entire document | Document     |
| `GET`    | `/roots/:id` | Read        | -               | Document     |
| `POST`   | `/roots/:id` | Update      | Entire document | Document     |
| `DELETE` | `/roots/:id` | Delete      | -               | -            |

## Sources

| Method   | URL             | Description | Payload* | Return Value |
|----------|-----------------|-------------|----------|--------------|
| `GET`    | `/sources/`     | Index       | -        | Documents    |
| `GET`    | `/sources/:key` | Read        | -        | Document     |

## Feedback

| Method   | URL                 | Description | Payload*        | Return Value |
|----------|---------------------|-------------|-----------------|--------------|
| `POST`   | `/feedback/suggest` | Add suggestion (checks for matches) | Entire document | Document     |

## Morphological generation

| Method   | URL                 | Description | Payload*        | Return Value |
|----------|---------------------|-------------|-----------------|--------------|
| `POST`   | `/morpho/generate/:paradigm`  | Generate inflections | { lemma: '...' } | Documents     |
| `POST`   | `/morpho/generate/:paradigm/:lexeme_id`  | Generate & insert inflections | { lemma: '...' } | -     |
