-- Admission Management System Schema

CREATE DATABASE IF NOT EXISTS admission_db;
USE admission_db;

-- 1. Programs table
CREATE TABLE IF NOT EXISTS programs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  institution_name VARCHAR(100) NOT NULL,
  campus_name VARCHAR(100) NOT NULL,
  department_name VARCHAR(100) NOT NULL,
  program_name VARCHAR(100) NOT NULL,
  course_type ENUM('UG', 'PG') NOT NULL DEFAULT 'UG',
  entry_type ENUM('Regular', 'Lateral') NOT NULL DEFAULT 'Regular',
  academic_year VARCHAR(10) NOT NULL DEFAULT '2026',
  total_intake INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Quotas table (child of programs)
-- filled_seats is updated atomically on every allocation
CREATE TABLE IF NOT EXISTS quotas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  program_id INT NOT NULL,
  quota_type ENUM('KCET', 'COMEDK', 'Management') NOT NULL,
  total_seats INT NOT NULL,
  filled_seats INT NOT NULL DEFAULT 0,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  -- Prevent duplicate quota types per program
  UNIQUE KEY uq_program_quota (program_id, quota_type)
);

-- 3. Applicants table
CREATE TABLE IF NOT EXISTS applicants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  phone VARCHAR(15),
  date_of_birth DATE,
  gender ENUM('Male', 'Female', 'Other'),
  category ENUM('GM', 'SC', 'ST', 'OBC') NOT NULL,
  entry_type ENUM('Regular', 'Lateral') NOT NULL DEFAULT 'Regular',
  quota_type ENUM('KCET', 'COMEDK', 'Management') NOT NULL,
  marks DECIMAL(6,2),
  allotment_number VARCHAR(100),       -- required for KCET/COMEDK govt flow
  address TEXT,
  document_status ENUM('Pending', 'Submitted', 'Verified') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Admissions table
-- One applicant can only have ONE admission record (enforced by UNIQUE on applicant_id)
CREATE TABLE IF NOT EXISTS admissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  applicant_id INT NOT NULL,
  program_id INT NOT NULL,
  quota_id INT NOT NULL,
  admission_number VARCHAR(100) DEFAULT NULL,   -- NULL until confirmed
  fee_status ENUM('Pending', 'Paid') NOT NULL DEFAULT 'Pending',
  status ENUM('allocated', 'confirmed') NOT NULL DEFAULT 'allocated',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (applicant_id) REFERENCES applicants(id),
  FOREIGN KEY (program_id) REFERENCES programs(id),
  FOREIGN KEY (quota_id) REFERENCES quotas(id),
  -- One applicant cannot be allocated twice
  UNIQUE KEY uq_applicant_admission (applicant_id)
);
