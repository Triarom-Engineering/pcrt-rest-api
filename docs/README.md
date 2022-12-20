# PCRT-REST-API Documentation

This document covers the endpoints included in the PCRT-REST-API project.

## Base URL

Endpoints follow the base URL of `<server>/api/v1/` 

## Authentication

Authentication is not yet implemented in PCRT-REST-API, thus, it should not be on a public network.

Authentication for endpoints is planned, and will integrate with PCRT users. 

## Data Types

This section covers the data structures for various data types used in PCRT, and how they are represented in the API.

### Phone

The phone data structure stores the vairous types of phone numbers accepted by PCRT - all values are optional.

| Field | Type | Description |
| landline | String | Landline phone number |
| mobile | String | Mobile phone number |
| work | String | Work phone number |

### Customer

A customer is a person or business that has open work orders or invoices.

| Field | Type | Description |
| customer_id | String | Unique ID of Customer, assigned by PCRT |
| first_name | String | First name(s) of Customer |
| second_name | String | Surname of Customer |
| address | String | Address of Customer |
| postcode | String | Postcode of Customer |
| phones | Phone | Phone number of Customer |
| email | String | Email address of Customer |
| notes | String | Notes about Customer |

> Note: not all values are exposed via the API, more will be implemented in due course.


### Asset Group

An asset group is a group of assets, such as a computer, laptop, tablet, etc.
This is an odd structure in PCRT that stores much of the same information as Customer, but can become out of sync until an engineer
clicks the sync button in PCRT. Thus, the API mostly ignores asset groups and instead links Work Orders to Customers.

| Field | Type | Description |
| asset_group_id | String | Unique ID of Asset Group, assigned by PCRT |
| name | String | Name of Asset Group |

### Work Order Status

A work order status is the status of a work order, such as Open, Closed, etc.

| Field | Type | Description |
| status_id | String | Unique ID of Work Order Status, assigned by PCRT |
| name | String | Name of Work Order Status |

### Work Order

A work order is an open or closed task to perform on a customer's device.

| Field | Type | Description |
| work_order_id | String | Unique ID of Work Order, assigned by PCRT |
| customer_id | String | Unique ID of Customer, assigned by PCRT |
| asset_group_id | String | Unique ID of Asset Group, assigned by PCRT |
| open_date | Date | Open date of Work Order |
| close_date | Date | Close date of Work Order - if the w/o is closed |
| status | WorkOrderStatus | Status of Work Order - Open, Closed, etc. |
| public_notes | String | Public notes about Work Order |
| private_notes | String | Private notes about Work Order |
| call_status | String | Call status of Work Order - not called, left voicemail etc. |
| repair_cart | Array<RepairCartItem> | Repair cart of Work Order - list of items that are charagble |

### Repair Cart Item

A repair cart item is a single item that is chargeable to a customer.

| Field | Type | Description |
| repair_cart_item_id | String | Unique ID of Repair Cart Item, assigned by PCRT |
| name | String | Name of Repair Cart Item |
| price | Float | Price of Repair Cart Item |

## Endpoints

- [Customers](./CUSTOMERS.md) - Endpoints related to fetching and manipulating customer information
- [Asssets](./ASSETS.md) - Endpoints related to fetching and manipulating asset information
- [Work Orders](./WORK_ORDERS.md) - Endpoints related to fetching and manipulating work order information