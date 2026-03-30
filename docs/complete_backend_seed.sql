CREATE DATABASE  IF NOT EXISTS `change_management` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `change_management`;
-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: change_management
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `approvals`
--

DROP TABLE IF EXISTS `approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `approvals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `request_id` int NOT NULL,
  `approver_id` int NOT NULL,
  `status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `remarks` text,
  `approved_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `request_id` (`request_id`),
  KEY `approver_id` (`approver_id`),
  CONSTRAINT `approvals_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `change_requests` (`id`),
  CONSTRAINT `approvals_ibfk_2` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `approvals`
--

LOCK TABLES `approvals` WRITE;
/*!40000 ALTER TABLE `approvals` DISABLE KEYS */;
INSERT INTO `approvals` VALUES (1,1,2,'Pending','Initial approval','2026-03-30 06:32:52','2026-03-30 12:02:52','2026-03-30 12:02:52'),(2,1,4,'Approved','','2026-03-30 06:55:01','2026-03-30 06:55:01','2026-03-30 06:55:01');
/*!40000 ALTER TABLE `approvals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attachments`
--

DROP TABLE IF EXISTS `attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attachments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `request_id` int NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `request_id` (`request_id`),
  CONSTRAINT `attachments_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `change_requests` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attachments`
--

LOCK TABLES `attachments` WRITE;
/*!40000 ALTER TABLE `attachments` DISABLE KEYS */;
INSERT INTO `attachments` VALUES (1,6,'uploads/file-1774853170930-322511675.png','2026-03-30 06:46:10','2026-03-30 06:46:10');
/*!40000 ALTER TABLE `attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `request_id` int NOT NULL,
  `user_id` int NOT NULL,
  `action` enum('CREATED','UPDATED','APPROVED','REJECTED','IMPLEMENTED') NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `request_id` (`request_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `change_requests` (`id`),
  CONSTRAINT `audit_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,1,'CREATED','2026-03-30 12:02:52','2026-03-30 12:02:52','2026-03-30 12:13:38'),(2,5,4,'CREATED','2026-03-30 06:43:41','2026-03-30 06:43:41','2026-03-30 06:43:41'),(3,6,4,'CREATED','2026-03-30 06:46:10','2026-03-30 06:46:10','2026-03-30 06:46:10'),(4,6,4,'UPDATED','2026-03-30 06:46:10','2026-03-30 06:46:10','2026-03-30 06:46:10'),(5,1,4,'APPROVED','2026-03-30 06:55:01','2026-03-30 06:55:01','2026-03-30 06:55:01');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `change_requests`
--

DROP TABLE IF EXISTS `change_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `change_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('Man','Machine','Method','Material') NOT NULL,
  `request_no` varchar(50) DEFAULT NULL,
  `request_date` date DEFAULT NULL,
  `production_line` varchar(120) DEFAULT NULL,
  `machine` varchar(120) DEFAULT NULL,
  `sub_type` varchar(120) DEFAULT NULL,
  `current_operator` varchar(120) DEFAULT NULL,
  `proposed_operator` varchar(120) DEFAULT NULL,
  `required_skills` text,
  `proposed_operator_skill_status` enum('Matched','Gap') DEFAULT NULL,
  `training_required` tinyint(1) NOT NULL DEFAULT '0',
  `training_status` enum('Not Required','Pending','Scheduled','Completed') DEFAULT 'Not Required',
  `training_notes` text,
  `compliance_requirements` text,
  `action_plan_required` tinyint(1) NOT NULL DEFAULT '0',
  `action_plan_notes` text,
  `title` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `current_state` text NOT NULL,
  `proposed_change` text NOT NULL,
  `reason` text NOT NULL,
  `old_value` text,
  `new_value` text,
  `impact_analysis` text NOT NULL,
  `quality_impact` enum('Low','Medium','High') DEFAULT NULL,
  `cost_impact` enum('Low','Medium','High') DEFAULT NULL,
  `delivery_impact` enum('Low','Medium','High') DEFAULT NULL,
  `safety_impact` enum('Low','Medium','High') DEFAULT NULL,
  `monitoring_period` varchar(120) DEFAULT NULL,
  `quality_result` varchar(200) DEFAULT NULL,
  `defect_rate` varchar(50) DEFAULT NULL,
  `monitoring_comments` text,
  `risk_level` enum('Low','Medium','High','Critical') NOT NULL,
  `department` varchar(120) NOT NULL,
  `status` enum('Pending','Approved','Rejected','Implemented','Closed') NOT NULL DEFAULT 'Pending',
  `created_by` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `change_requests_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `change_requests`
--

LOCK TABLES `change_requests` WRITE;
/*!40000 ALTER TABLE `change_requests` DISABLE KEYS */;
INSERT INTO `change_requests` VALUES (1,'Man',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'Not Required',NULL,NULL,0,NULL,'Change 1','Desc 1','State 1','Change 1','Reason 1',NULL,NULL,'Impact 1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Low','Production','Pending',1,'2026-03-30 12:12:55','2026-03-30 12:12:55'),(2,'Machine','CR-20260330-1208','2026-03-30','Line A','Machine 1','SubType 2','','','',NULL,0,'Not Required','','Machine capability verification, Safety interlock validation',1,'Recommended action plan: Action 2','Change Mahine','[Machine - SubType 2] Change Mahine','12','13','Change Mahine','12','13','Quality Impact: Low\nCost Impact: Low\nDelivery Impact: Low\nSafety Impact: Low','Low','Low','Low','Low',NULL,NULL,NULL,NULL,'Low','Maintenance','Pending',4,'2026-03-30 06:42:59','2026-03-30 06:42:59'),(3,'Machine','CR-20260330-1208','2026-03-30','Line A','Machine 1','SubType 2','','','',NULL,0,'Not Required','','Machine capability verification, Safety interlock validation',1,'Recommended action plan: Action 2','Change Mahine','[Machine - SubType 2] Change Mahine','12','13','Change Mahine','12','13','Quality Impact: Low\nCost Impact: Low\nDelivery Impact: Low\nSafety Impact: Low','Low','Low','Low','Low',NULL,NULL,NULL,NULL,'Low','Maintenance','Pending',4,'2026-03-30 06:43:01','2026-03-30 06:43:01'),(4,'Machine','CR-20260330-1208','2026-03-30','Line A','Machine 1','SubType 2','','','',NULL,0,'Not Required','','Machine capability verification, Safety interlock validation',1,'Recommended action plan: Action 2','Change Mahine','[Machine - SubType 2] Change Mahine','12','13','Change Mahine','12','13','Quality Impact: Low\nCost Impact: Low\nDelivery Impact: Low\nSafety Impact: Low','Low','Low','Low','Low',NULL,NULL,NULL,NULL,'Low','Maintenance','Pending',4,'2026-03-30 06:43:03','2026-03-30 06:43:03'),(5,'Machine','CR-20260330-1208','2026-03-30','Line A','Machine 1','SubType 2','','','',NULL,0,'Not Required','','Machine capability verification, Safety interlock validation',1,'Recommended action plan: Action 2','Change Mahine','[Machine - SubType 2] Change Mahine','12','13','Change Mahine','12','13','Quality Impact: Low\nCost Impact: Low\nDelivery Impact: Low\nSafety Impact: Low','Low','Low','Low','Low',NULL,NULL,NULL,NULL,'Low','Maintenance','Pending',4,'2026-03-30 06:43:41','2026-03-30 06:43:41'),(6,'Machine','CR-20260330-1208','2026-03-30','Line A','Machine 1','SubType 2','','','',NULL,0,'Not Required','','Machine capability verification, Safety interlock validation',1,'Recommended action plan: Action 2','Change Mahine','[Machine - SubType 2] Change Mahine','12','13','Change Mahine','12','13','Quality Impact: Low\nCost Impact: Low\nDelivery Impact: Low\nSafety Impact: Low','Low','Low','Low','Low',NULL,NULL,NULL,NULL,'Low','Maintenance','Pending',4,'2026-03-30 06:46:10','2026-03-30 06:46:10');
/*!40000 ALTER TABLE `change_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `change_sub_types`
--

DROP TABLE IF EXISTS `change_sub_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `change_sub_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(50) NOT NULL,
  `name` varchar(120) NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `change_sub_types`
--

LOCK TABLES `change_sub_types` WRITE;
/*!40000 ALTER TABLE `change_sub_types` DISABLE KEYS */;
INSERT INTO `change_sub_types` VALUES (1,'Man','SubType 1','Active','2026-03-30 12:02:52','2026-03-30 12:02:52'),(2,'Machine','SubType 2','Active','2026-03-30 12:02:52','2026-03-30 12:02:52'),(3,'Method','SubType 3','Active','2026-03-30 12:02:52','2026-03-30 12:02:52'),(4,'Material','SubType 4','Active','2026-03-30 12:02:52','2026-03-30 12:02:52'),(5,'Machine','SubType 5','Inactive','2026-03-30 12:02:52','2026-03-30 12:02:52'),(6,'Man','SubType 6','Active','2026-03-30 12:02:52','2026-03-30 12:02:52');
/*!40000 ALTER TABLE `change_sub_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Production','Active','2026-03-30 12:02:51','2026-03-30 12:02:51'),(2,'Quality','Active','2026-03-30 12:02:51','2026-03-30 12:02:51'),(3,'Maintenance','Active','2026-03-30 12:02:51','2026-03-30 12:02:51'),(4,'HR','Active','2026-03-30 12:02:51','2026-03-30 12:02:51');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guided_setup_progress`
--

DROP TABLE IF EXISTS `guided_setup_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guided_setup_progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `flow_type` enum('Man','Machine','Method','Material') NOT NULL,
  `completed_steps` json NOT NULL DEFAULT (json_array()),
  `current_step_index` int NOT NULL DEFAULT '0',
  `draft_forms` json NOT NULL DEFAULT (json_object()),
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_flow` (`user_id`,`flow_type`),
  UNIQUE KEY `guided_setup_progress_user_id_flow_type` (`user_id`,`flow_type`),
  CONSTRAINT `guided_setup_progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guided_setup_progress`
--

LOCK TABLES `guided_setup_progress` WRITE;
/*!40000 ALTER TABLE `guided_setup_progress` DISABLE KEYS */;
INSERT INTO `guided_setup_progress` VALUES (1,1,'Man','[\"step1\"]',1,'{\"form1\": \"data1\"}','2026-03-30 06:32:52','2026-03-30 06:32:52'),(2,2,'Machine','[]',0,'{}','2026-03-30 07:13:15','2026-03-30 07:13:15'),(3,4,'Machine','[]',0,'{}','2026-03-30 07:45:37','2026-03-30 07:45:37');
/*!40000 ALTER TABLE `guided_setup_progress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `machine_skill_requirements`
--

DROP TABLE IF EXISTS `machine_skill_requirements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `machine_skill_requirements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `machine` varchar(120) NOT NULL,
  `skill` varchar(120) NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `machine_skill_requirements`
--

LOCK TABLES `machine_skill_requirements` WRITE;
/*!40000 ALTER TABLE `machine_skill_requirements` DISABLE KEYS */;
INSERT INTO `machine_skill_requirements` VALUES (1,'Machine 1','Skill A','Active','2026-03-30 12:02:52','2026-03-30 12:02:52'),(2,'Machine 2','Skill B','Active','2026-03-30 12:02:52','2026-03-30 12:02:52');
/*!40000 ALTER TABLE `machine_skill_requirements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `machines`
--

DROP TABLE IF EXISTS `machines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `machines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `machines`
--

LOCK TABLES `machines` WRITE;
/*!40000 ALTER TABLE `machines` DISABLE KEYS */;
INSERT INTO `machines` VALUES (1,'Machine 1','Active','2026-03-30 12:02:52','2026-03-30 12:02:52'),(2,'Machine 2','Active','2026-03-30 12:02:52','2026-03-30 12:02:52');
/*!40000 ALTER TABLE `machines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `master_data`
--

DROP TABLE IF EXISTS `master_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `master_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category` enum('department','production_line','machine','change_subtype','risk_level','operator','skill','operator_skill_map','machine_skill_requirement','training_program','type_requirement','type_action_template') NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_category_type_name` (`category`,`type`,`name`),
  UNIQUE KEY `master_data_category_type_name` (`category`,`type`,`name`)
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `master_data`
--

LOCK TABLES `master_data` WRITE;
/*!40000 ALTER TABLE `master_data` DISABLE KEYS */;
INSERT INTO `master_data` VALUES (1,'department',NULL,'Production','Active','2026-03-30 06:32:52','2026-03-30 06:32:52'),(2,'production_line',NULL,'Line A','Active','2026-03-30 06:32:52','2026-03-30 06:32:52'),(3,'machine',NULL,'Machine 1','Active','2026-03-30 06:32:52','2026-03-30 06:32:52'),(4,'change_subtype',NULL,'Subtype 1','Active','2026-03-30 06:32:52','2026-03-30 06:32:52'),(5,'risk_level',NULL,'Low','Active','2026-03-30 06:32:52','2026-03-30 06:32:52'),(6,'operator',NULL,'Operator 1','Active','2026-03-30 06:32:52','2026-03-30 06:32:52'),(7,'skill',NULL,'Skill A','Active','2026-03-30 06:32:52','2026-03-30 06:32:52'),(8,'operator_skill_map','Operator 1','Skill A','Active','2026-03-30 06:32:52','2026-03-30 06:32:52'),(9,'operator_skill_map','Operator 2','Skill B','Active','2026-03-30 06:32:52','2026-03-30 06:32:52'),(10,'machine_skill_requirement','Machine 1','Skill A','Active','2026-03-30 06:32:52','2026-03-30 06:32:52'),(11,'machine_skill_requirement','Machine 2','Skill B','Active','2026-03-30 06:32:52','2026-03-30 06:32:52'),(12,'training_program',NULL,'TP 1','Active','2026-03-30 06:32:52','2026-03-30 06:32:52'),(13,'type_requirement',NULL,'Req 1','Active','2026-03-30 06:32:52','2026-03-30 06:32:52'),(14,'type_action_template',NULL,'Action 1','Active','2026-03-30 06:32:52','2026-03-30 06:32:52'),(15,'department',NULL,'Quality','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(16,'department',NULL,'Maintenance','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(17,'machine',NULL,'MCH-1001','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(18,'machine',NULL,'MCH-1002','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(19,'risk_level',NULL,'Medium','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(20,'risk_level',NULL,'High','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(21,'risk_level',NULL,'Critical','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(22,'change_subtype','Man','Operator Change','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(23,'change_subtype','Man','Supervisor Change','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(24,'change_subtype','Man','Skill/Training Change','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(25,'change_subtype','Man','Shift Manpower Change','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(26,'change_subtype','Machine','Machine Replacement','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(27,'change_subtype','Machine','Maintenance','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(28,'change_subtype','Machine','Tooling/Mold/Die Change','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(29,'change_subtype','Machine','Machine Parameter Update','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(30,'change_subtype','Method','SOP Update','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(31,'change_subtype','Method','Process Flow Update','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(32,'change_subtype','Method','Inspection Method Update','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(33,'change_subtype','Method','Cycle Time Change','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(34,'change_subtype','Material','Raw Material Change','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(35,'change_subtype','Material','Vendor Change','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(36,'change_subtype','Material','Grade/Specification Change','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(37,'change_subtype','Material','Packaging Material Change','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(38,'operator',NULL,'Operator A','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(39,'operator',NULL,'Operator B','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(40,'operator',NULL,'Operator C','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(41,'skill',NULL,'CNC Operation','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(42,'skill',NULL,'Hydraulic Press Handling','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(43,'skill',NULL,'SOP Compliance','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(44,'operator_skill_map','Operator A','CNC Operation','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(45,'operator_skill_map','Operator A','SOP Compliance','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(46,'operator_skill_map','Operator B','Hydraulic Press Handling','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(47,'operator_skill_map','Operator C','SOP Compliance','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(48,'machine_skill_requirement','MCH-1001','CNC Operation','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(49,'machine_skill_requirement','MCH-1001','SOP Compliance','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(50,'machine_skill_requirement','MCH-1002','Hydraulic Press Handling','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(51,'training_program','CNC Operation','CNC Operation Level-1 Training','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(52,'training_program','Hydraulic Press Handling','Hydraulic Safety & Handling Training','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(53,'training_program','SOP Compliance','SOP Refresher Training','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(54,'type_requirement','Machine','Machine capability verification','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(55,'type_requirement','Machine','Safety interlock validation','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(56,'type_requirement','Method','SOP revision approval','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(57,'type_requirement','Method','Trial run and process audit','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(58,'type_requirement','Material','Incoming quality validation','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(59,'type_requirement','Material','Vendor CoA verification','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(60,'type_action_template','Machine','Schedule machine trial and calibration','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(61,'type_action_template','Method','Train team on revised SOP','Active','2026-03-30 06:35:39','2026-03-30 06:35:39'),(62,'type_action_template','Material','Run pilot lot and monitor defects','Active','2026-03-30 06:35:39','2026-03-30 06:35:39');
/*!40000 ALTER TABLE `master_data` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `operator_skill_maps`
--

DROP TABLE IF EXISTS `operator_skill_maps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `operator_skill_maps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `operator` varchar(120) NOT NULL,
  `skill` varchar(120) NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `operator_skill_maps`
--

LOCK TABLES `operator_skill_maps` WRITE;
/*!40000 ALTER TABLE `operator_skill_maps` DISABLE KEYS */;
INSERT INTO `operator_skill_maps` VALUES (1,'Operator 1','Skill A','Active','2026-03-30 12:02:52','2026-03-30 12:02:52'),(2,'Operator 2','Skill B','Active','2026-03-30 12:02:52','2026-03-30 12:02:52');
/*!40000 ALTER TABLE `operator_skill_maps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `operators`
--

DROP TABLE IF EXISTS `operators`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `operators` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `operators`
--

LOCK TABLES `operators` WRITE;
/*!40000 ALTER TABLE `operators` DISABLE KEYS */;
INSERT INTO `operators` VALUES (1,'Operator 1','Active','2026-03-30 12:02:52','2026-03-30 12:02:52'),(2,'Operator 2','Active','2026-03-30 12:02:52','2026-03-30 12:02:52');
/*!40000 ALTER TABLE `operators` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `production_lines`
--

DROP TABLE IF EXISTS `production_lines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_lines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `production_lines`
--

LOCK TABLES `production_lines` WRITE;
/*!40000 ALTER TABLE `production_lines` DISABLE KEYS */;
INSERT INTO `production_lines` VALUES (1,'Line A','Active','2026-03-30 12:02:51','2026-03-30 12:02:51'),(2,'Line B','Active','2026-03-30 12:02:51','2026-03-30 12:02:51');
/*!40000 ALTER TABLE `production_lines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `risk_levels`
--

DROP TABLE IF EXISTS `risk_levels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `risk_levels` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `risk_levels`
--

LOCK TABLES `risk_levels` WRITE;
/*!40000 ALTER TABLE `risk_levels` DISABLE KEYS */;
INSERT INTO `risk_levels` VALUES (1,'Low','Active','2026-03-30 12:02:51','2026-03-30 12:02:51'),(2,'Medium','Active','2026-03-30 12:02:51','2026-03-30 12:02:51'),(3,'High','Active','2026-03-30 12:02:51','2026-03-30 12:02:51'),(4,'Critical','Active','2026-03-30 12:02:51','2026-03-30 12:02:51');
/*!40000 ALTER TABLE `risk_levels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL,
  `permissions` json NOT NULL DEFAULT (json_array()),
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_id` (`role_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1,'[\"dashboard.view\", \"changes.read\", \"changes.create\", \"changes.update\", \"changes.delete\", \"approvals.read\", \"approvals.approve\", \"users.read\", \"users.create\", \"users.update\", \"users.delete\", \"roles.read\", \"roles.create\", \"roles.update\", \"roles.delete\", \"attachments.read\", \"attachments.upload\", \"attachments.delete\", \"masters.department.read\", \"masters.department.create\", \"masters.department.update\", \"masters.department.delete\", \"masters.machine.read\", \"masters.machine.create\", \"masters.machine.update\", \"masters.machine.delete\", \"masters.productionline.read\", \"masters.productionline.create\", \"masters.productionline.update\", \"masters.productionline.delete\", \"masters.skill.read\", \"masters.skill.create\", \"masters.skill.update\", \"masters.skill.delete\", \"guidedsetup.man.read\", \"guidedsetup.man.update\", \"guidedsetup.machine.read\", \"guidedsetup.machine.update\", \"guidedsetup.method.read\", \"guidedsetup.method.update\", \"guidedsetup.material.read\", \"guidedsetup.material.update\"]','2026-03-30 12:02:51','2026-03-30 07:49:33'),(2,2,'[\"dashboard.view\", \"changes.read\", \"changes.create\", \"changes.update\", \"changes.delete\", \"approvals.read\", \"approvals.approve\", \"users.read\", \"users.create\", \"users.update\", \"users.delete\", \"roles.read\", \"roles.create\", \"roles.update\", \"roles.delete\", \"attachments.read\", \"attachments.upload\", \"attachments.delete\"]','2026-03-30 12:02:51','2026-03-30 07:11:19'),(3,3,'[\"attachments.read\", \"changes.create\", \"changes.read\", \"dashboard.view\", \"masters.department.read\", \"masters.department.create\", \"masters.department.update\", \"masters.department.delete\"]','2026-03-30 12:02:51','2026-03-30 09:22:40'),(4,4,'[\"READ\"]','2026-03-30 12:02:51','2026-03-30 12:02:51'),(5,5,'[\"dashboard.view\", \"changes.read\", \"changes.create\", \"changes.update\", \"approvals.read\", \"attachments.read\", \"attachments.upload\"]','2026-03-30 06:35:38','2026-03-30 06:35:38');
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'SuperAdmin','2026-03-30 12:02:51','2026-03-30 12:02:51'),(2,'Admin','2026-03-30 12:02:51','2026-03-30 12:02:51'),(3,'Manager','2026-03-30 12:02:51','2026-03-30 12:02:51'),(4,'Operator','2026-03-30 12:02:51','2026-03-30 12:02:51'),(5,'User','2026-03-30 06:35:38','2026-03-30 06:35:38');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `skills`
--

DROP TABLE IF EXISTS `skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `skills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `skills`
--

LOCK TABLES `skills` WRITE;
/*!40000 ALTER TABLE `skills` DISABLE KEYS */;
INSERT INTO `skills` VALUES (1,'Skill A','Active','2026-03-30 12:02:52','2026-03-30 12:02:52'),(2,'Skill B','Active','2026-03-30 12:02:52','2026-03-30 12:02:52');
/*!40000 ALTER TABLE `skills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `training_programs`
--

DROP TABLE IF EXISTS `training_programs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `training_programs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `skill` varchar(120) NOT NULL,
  `name` varchar(120) NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `training_programs`
--

LOCK TABLES `training_programs` WRITE;
/*!40000 ALTER TABLE `training_programs` DISABLE KEYS */;
INSERT INTO `training_programs` VALUES (1,'Skill A','TP 1','Active','2026-03-30 12:02:52','2026-03-30 12:02:52'),(2,'Skill B','TP 2','Active','2026-03-30 12:02:52','2026-03-30 12:02:52');
/*!40000 ALTER TABLE `training_programs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `type_action_templates`
--

DROP TABLE IF EXISTS `type_action_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `type_action_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(50) NOT NULL,
  `name` varchar(120) NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `type_action_templates`
--

LOCK TABLES `type_action_templates` WRITE;
/*!40000 ALTER TABLE `type_action_templates` DISABLE KEYS */;
INSERT INTO `type_action_templates` VALUES (1,'Man','Action 1','Active','2026-03-30 12:02:52','2026-03-30 12:02:52'),(2,'Machine','Action 2','Active','2026-03-30 12:02:52','2026-03-30 12:02:52');
/*!40000 ALTER TABLE `type_action_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `type_requirements`
--

DROP TABLE IF EXISTS `type_requirements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `type_requirements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(50) NOT NULL,
  `name` varchar(120) NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `type_requirements`
--

LOCK TABLES `type_requirements` WRITE;
/*!40000 ALTER TABLE `type_requirements` DISABLE KEYS */;
INSERT INTO `type_requirements` VALUES (1,'Man','Req 1','Active','2026-03-30 12:02:52','2026-03-30 12:02:52'),(2,'Machine','Req 2','Active','2026-03-30 12:02:52','2026-03-30 12:02:52');
/*!40000 ALTER TABLE `type_requirements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(120) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` int NOT NULL,
  `department_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin User','admin@example.com','$2a$10$demoHash',2,2,'2026-03-30 06:32:51','2026-03-30 06:32:51'),(2,'Manager User','manager@example.com','$2a$12$SAIB9ZogmT53D62o5zogv.luvSvnbf0ml8TtzVZA6ai9QovB6t6rK',3,3,'2026-03-30 06:32:51','2026-03-30 07:03:09'),(3,'Operator User','operator@example.com','$2a$10$demoHash',4,1,'2026-03-30 06:32:51','2026-03-30 06:32:51'),(4,'System SuperAdmin','superadmin@example.com','$2a$12$nPsnt9Tj9KyTgr1Vya/rtexHJLi8WH0bbdgBSYF2gBm8qQR94FBWW',1,1,'2026-03-30 06:35:38','2026-03-30 06:35:39');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-30 16:22:13
