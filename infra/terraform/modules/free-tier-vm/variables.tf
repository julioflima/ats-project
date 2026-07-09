variable "name" {
  type = string
}

variable "machine_type" {
  type    = string
  default = "e2-micro"
}

variable "zone" {
  type = string
}

variable "subnetwork_id" {
  type = string
}

variable "tags" {
  type    = list(string)
  default = []
}

variable "service_account_email" {
  type = string
}

variable "startup_script" {
  type = string
}
