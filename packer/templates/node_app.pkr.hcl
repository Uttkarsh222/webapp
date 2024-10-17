# Required plugins for Packer to interact with AWS
packer {
  required_plugins {
    amazon = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

# Declare the variables used in the template
variable "aws_region" {
  type = string
}

variable "instance_type" {
  type = string
}

variable "ami_name_prefix" {
  type = string
}

variable "source_ami" {
  type        = string
  description = "The ID of the source AMI to use for building the custom AMI"
}

variable "aws_access_key" {
  type      = string
  sensitive = true
}

variable "aws_secret_key" {
  type      = string
  sensitive = true
}

variable "DBROOT_USER" {
  type = string
}

variable "ROOT_PASSWORD" {
  type = string
}


# Define the source block for the custom AMI using amazon-ebs
source "amazon-ebs" "ubuntu" {
  ami_name      = "${replace(var.ami_name_prefix, "/[^a-zA-Z0-9-]/", "")}-${formatdate("YYYYMMDDHHmmss", timestamp())}"
  instance_type = var.instance_type
  region        = var.aws_region
  source_ami    = var.source_ami
  ssh_username  = "ubuntu"
  access_key    = var.aws_access_key
  secret_key    = var.aws_secret_key

  associate_public_ip_address = true
  ssh_interface               = "public_ip"
}

# Define the build block that references the source block
build {
  sources = ["source.amazon-ebs.ubuntu"]

  # Provision files (application source code and config files)
  provisioner "file" {
    source      = "./src"
    destination = "/home/ubuntu/src"
  }

  provisioner "file" {
    source      = "./package.json"
    destination = "/home/ubuntu/package.json"
  }

  provisioner "file" {
    source      = "./package-lock.json"
    destination = "/home/ubuntu/package-lock.json"
  }

  provisioner "file" {
    source      = "./.env"
    destination = "/home/ubuntu/.env"
  }

  # Install dependencies, set up the application, and configure services
  provisioner "shell" {
    script = "./packer/scripts/install_dependencies.sh"
  }

  provisioner "shell" {
    script = "./packer/scripts/setup_application.sh"
  }

  provisioner "shell" {

    environment_vars = [
      "DEBIAN_FRONTEND=noninteractive",
      "CHECKPOINT_DISABLE=1",
      "ROOT_PASSWORD=${var.ROOT_PASSWORD}",
      "DBROOT_USER=${var.DBROOT_USER}"

    ]

    script = "./packer/scripts/configure_services.sh"
  }
}
