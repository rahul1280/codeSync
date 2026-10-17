const roomService = require('../services/roomService');
const { success } = require('../utils/responseHelper');
const catchAsync = require('../utils/catchAsync');

const createRoom = catchAsync(async (req, res) => {
  const { name, language } = req.body;
  const room = await roomService.createRoom({
    name,
    language,
    userId: req.user.id
  });

  return success(res, { room }, 201, 'Room created successfully');
});

const getRooms = catchAsync(async (req, res) => {
  const rooms = await roomService.getUserRooms(req.user.id);
  return success(res, { rooms }, 200);
});

const getRoom = catchAsync(async (req, res) => {
  const room = await roomService.getRoomById(req.params.roomId);
  return success(res, { room }, 200);
});

const updateRoom = catchAsync(async (req, res) => {
  const room = await roomService.updateRoom(req.params.roomId, req.body);
  return success(res, { room }, 200, 'Room updated successfully');
});

const deleteRoom = catchAsync(async (req, res) => {
  await roomService.deleteRoom(req.params.roomId);
  return success(res, null, 200, 'Room deleted successfully');
});

const createInvitation = catchAsync(async (req, res) => {
  const { role, expiresInHours } = req.body;
  const invitation = await roomService.createInvitation(
    req.params.roomId,
    req.user.id,
    { role, expiresInHours }
  );

  return success(
    res,
    { invitation },
    201,
    'Invitation link created successfully'
  );
});

const revokeInvitation = catchAsync(async (req, res) => {
  const { token } = req.params;
  const result = await roomService.revokeInvitation(req.params.roomId, token);
  return success(res, result, 200, 'Invitation revoked successfully');
});

const joinRoom = catchAsync(async (req, res) => {
  const token = req.body.token || req.body.inviteCode;
  const room = await roomService.joinRoomWithToken(req.user.id, token);
  return success(res, { room }, 200, 'Joined room successfully');
});

const leaveRoom = catchAsync(async (req, res) => {
  const result = await roomService.leaveRoom(req.params.roomId, req.user.id);
  return success(res, result, 200, 'Left room successfully');
});

const updateMember = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  const room = await roomService.updateMemberRole(req.params.roomId, userId, role);
  return success(res, { room }, 200, 'Member role updated successfully');
});

const removeMember = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await roomService.removeMember(req.params.roomId, userId);
  return success(res, result, 200, 'Member removed successfully');
});

module.exports = {
  createRoom,
  getRooms,
  getRoom,
  updateRoom,
  deleteRoom,
  createInvitation,
  revokeInvitation,
  joinRoom,
  leaveRoom,
  updateMember,
  removeMember
};
