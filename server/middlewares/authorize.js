const mongoose = require('mongoose');
const Room = require('../models/Room');
const AppError = require('../utils/AppError');
const { ROLES } = require('../utils/constants');

/**
 * Factory function to authorize access to a room based on roles
 * @param {Array<string>|string} requiredRoles - Roles permitted to perform the action
 */
function authorize(requiredRoles = [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]) {
  const allowed = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return async (req, res, next) => {
    try {
      const roomId = req.params.roomId;

      if (!roomId) {
        return next(new AppError('Room ID is required for authorization', 400, 'ROOM_ID_REQUIRED'));
      }

      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        return next(new AppError('Invalid Room ID format', 400, 'INVALID_ROOM_ID'));
      }

      const room = await Room.findById(roomId);
      if (!room) {
        return next(new AppError('Room not found', 404, 'ROOM_NOT_FOUND'));
      }

      const userId = req.user.id;
      const isOwner = room.ownerId.toString() === userId;

      let memberRole = null;
      let memberRecord = null;

      if (isOwner) {
        memberRole = ROLES.OWNER;
        memberRecord = {
          userId,
          role: ROLES.OWNER,
          joinedAt: room.createdAt
        };
      } else {
        const foundMember = room.members.find(
          (m) => m.userId.toString() === userId
        );
        if (foundMember) {
          memberRole = foundMember.role;
          memberRecord = foundMember;
        }
      }

      if (!memberRole) {
        return next(new AppError('You are not a member of this room', 403, 'FORBIDDEN_NOT_MEMBER'));
      }

      if (!allowed.includes(memberRole)) {
        return next(
          new AppError(
            `Access denied. Requires one of roles: ${allowed.join(', ')}`,
            403,
            'FORBIDDEN_INSUFFICIENT_PERMISSIONS'
          )
        );
      }

      req.room = room;
      req.membership = memberRecord;

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = authorize;
