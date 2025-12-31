## Tables

---

### `users`

Stores user account information.

#### Columns

| Name | Type | Description |
| --- | --- | --- |
| `id` | `SERIAL` | Primary Key |
| `email` | `TEXT` | User email address (Unique, Not Null) |
| `password` | `TEXT` | Hashed user password (Not Null) |
| `created_at` | `TIMESTAMPTZ` | Timestamp of account creation (Default: `CURRENT_TIMESTAMP`) |

---

### `client_info`

Stores OAuth2/OpenID Connect client credentials and configurations.

#### Columns

| Name | Type | Description |
| --- | --- | --- |
| `id` | `UUID` | Primary Key (Default: `uuid_generate_v4()`) |
| `client_secret` | `TEXT` | Secret key for client authentication (Not Null) |
| `client_id` | `TEXT` | Public identifier or key for the client |
| `redirect_urls` | `JSONB` | List of authorized redirect URIs |

#### Constraints & Indexes

* **Primary Key:** `client_info_pkey` on `id`

---

### `auth_codes`

Stores temporary authorization codes for the OAuth flow.


#### Columns

| Name | Type | Description |
| --- | --- | --- |
| `code` | `UUID` | Primary Key |
| `client_id` | `UUID` | Foreign Key referencing `client_info(id)` |
| `user_id` | `INTEGER` | Foreign Key referencing `users(id)` |
| `expires_at` | `TIMESTAMP WITH TIME ZONE` | Expiration time (Default: 10 minutes from creation) |
| `used` | `BOOLEAN` | Flag to track if the code has been exchanged |

#### Constraints & Indexes

* **Primary Key:** `auth_codes_pkey` on `code`
* **Foreign Key:** `client_id_constraint` references `public.client_info(id)`
* **Foreign Key:** `user_id_constraint` references `public.users(id)`

---
