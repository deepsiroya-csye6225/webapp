packer {
  required_plugins {
    amazon = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}


variable "instance_type" {
  type    = string
  default = "t2.micro"
}

variable "source_ami" {
  type    = string
  default = "ami-06db4d78cb1d3bbf9"
}

variable "ssh_username" {
  type    = string
  default = "admin"
}

variable "subnet_id" {
  type    = string
  default = "subnet-0ef4f9146c2d65ace"
}

source "amazon-ebs" "debian-ami" {
  region          = "${var.aws_region}"
  ami_name        = "csye6225_${formatdate("YYYY_MM_DD_hh_mm_ss", timestamp())}"
  ami_description = "CSYE6225_Cloud_DebianAMI"

  ami_regions = [
    "us-east-1",
  ]

  aws_polling {
    delay_seconds = 50
    max_attempts  = 25
  }

  instance_type = "${var.instance_type}"
  source_ami    = "${var.source_ami}"
  ssh_username  = "${var.ssh_username}"
  subnet_id     = "${var.subnet_id}"

}

build {
  sources = ["source.amazon-ebs.debian-ami"]

  provisioner "file" {
    source      = "../webapp.zip"
    destination = "/tmp/webapp.zip"
}

  provisioner "shell" {
    environment_vars = [
      "DEBIAN_FRONTEND=noninteractive",
      "CHECKPOINT_DISABLE=1"
    ]
    script = "./install-pkg.sh"
  }

}