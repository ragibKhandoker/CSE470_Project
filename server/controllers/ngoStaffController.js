const db = require('../config/db');
let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (e) {
  bcrypt = require('bcryptjs');
}
const ngoStaffModel = require('../models/ngoStaffModel');
const userModel = require('../models/userModel');

/**
 * Controller for NGO Staff Management
 */

// List staff belonging to the authenticated NGO (or all NGO staff if Super Admin / Admin)
const listStaff = async (req, res, next) => {
  try {
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    let ngoAdminId = req.user.parent_ngo_id || req.user.id;
    if (isAdmin && req.query.ngoId) {
      ngoAdminId = req.query.ngoId;
    }
    const staff = await ngoStaffModel.getStaffByParentNgo(ngoAdminId, isAdmin);

    return res.status(200).json({
      message: 'Staff list retrieved successfully',
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

// Add a new staff member (Receiving Staff or Distributor Staff)
const createStaff = async (req, res, next) => {
  try {
    if (req.user.ngo_staff_role && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Only NGO Administrators can manage staff or assign roles.' });
    }
    const { name, phone, email, password, ngo_staff_role, address, nid } = req.body;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

    if (!name || !phone || !password || !ngo_staff_role) {
      return res.status(400).json({
        message: 'Name, phone, password, and staff role (receiving_staff or distributor_staff) are required.'
      });
    }

    if (!['receiving_staff', 'distributor_staff'].includes(ngo_staff_role)) {
      return res.status(400).json({
        message: 'Role must be either "receiving_staff" or "distributor_staff".'
      });
    }

    // Check if phone or email is already registered
    const existingUser = await userModel.findByPhone(phone);
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this phone number already exists.' });
    }

    if (email) {
      const existingEmail = await userModel.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ message: 'A user with this email address already exists.' });
      }
    }

    const password_hash = await bcrypt.hash(password, 10);
    let ngoAdminId = req.user.parent_ngo_id || req.user.id;
    if (isAdmin) {
      const defaultNgo = await db.query("SELECT id FROM users WHERE role = 'ngo' AND parent_ngo_id IS NULL ORDER BY id ASC LIMIT 1");
      if (defaultNgo.rows.length > 0) {
        ngoAdminId = defaultNgo.rows[0].id;
      }
    }

    const newStaff = await ngoStaffModel.createStaffMember({
      name,
      phone,
      email,
      address,
      nid,
      password_hash,
      plain_password: password,
      ngo_staff_role,
      parent_ngo_id: ngoAdminId
    });

    return res.status(201).json({
      message: 'Staff member added successfully!',
      data: newStaff
    });
  } catch (error) {
    next(error);
  }
};

// Update an existing staff member's information
const updateStaff = async (req, res, next) => {
  try {
    if (req.user.ngo_staff_role && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Only NGO Administrators can manage staff or assign roles.' });
    }
    const staffId = req.params.id;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    const ngoAdminId = req.user.parent_ngo_id || req.user.id;
    const { name, phone, email, address, nid, ngo_staff_role } = req.body;

    if (ngo_staff_role && !['receiving_staff', 'distributor_staff'].includes(ngo_staff_role)) {
      return res.status(400).json({
        message: 'Role must be either "receiving_staff" or "distributor_staff".'
      });
    }

    const updated = await ngoStaffModel.updateStaffMember(staffId, ngoAdminId, {
      name,
      phone,
      email,
      address,
      nid,
      ngo_staff_role
    }, isAdmin);

    if (!updated) {
      return res.status(404).json({ message: 'Staff member not found or does not belong to your organization.' });
    }

    return res.status(200).json({
      message: 'Staff member details updated successfully!',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// Dedicated Assign Role endpoint for fast role switching
const assignRole = async (req, res, next) => {
  try {
    if (req.user.ngo_staff_role && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Only NGO Administrators can assign roles.' });
    }
    const staffId = req.params.id;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    const ngoAdminId = req.user.parent_ngo_id || req.user.id;
    const { ngo_staff_role, role } = req.body;
    const targetRole = ngo_staff_role || role;

    if (!targetRole || !['receiving_staff', 'distributor_staff'].includes(targetRole)) {
      return res.status(400).json({
        message: 'Role must be either "receiving_staff" or "distributor_staff".'
      });
    }

    const updated = await ngoStaffModel.updateStaffMember(staffId, ngoAdminId, {
      ngo_staff_role: targetRole
    }, isAdmin);

    if (!updated) {
      return res.status(404).json({ message: 'Staff member not found or does not belong to your organization.' });
    }

    return res.status(200).json({
      message: `Role assigned successfully: ${targetRole === 'receiving_staff' ? 'Receiving Staff' : 'Distributor Staff'}`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// Remove a staff member
const removeStaff = async (req, res, next) => {
  try {
    if (req.user.ngo_staff_role && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Only NGO Administrators can manage staff.' });
    }
    const staffId = req.params.id;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    const ngoAdminId = req.user.parent_ngo_id || req.user.id;

    const removed = await ngoStaffModel.deleteStaffMember(staffId, ngoAdminId, isAdmin);
    if (!removed) {
      return res.status(404).json({ message: 'Staff member not found or does not belong to your organization.' });
    }

    return res.status(200).json({
      message: 'Staff member removed successfully',
      data: removed
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listStaff,
  createStaff,
  updateStaff,
  assignRole,
  removeStaff
};
