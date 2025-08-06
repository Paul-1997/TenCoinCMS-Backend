import { FastifyRequest, FastifyReply } from 'fastify';

export const validateApiKey = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const apiKey = request.headers['x-api-key'];
  const expectedApiKey = process.env.API_KEY;
  
  if (!expectedApiKey) {
    reply.status(500).send({
      success: false,
      error: 'API key not configured on server',
    });
    return;
  }
  
  if (!apiKey || apiKey !== expectedApiKey) {
    reply.status(401).send({
      success: false,
      error: 'Invalid or missing API key',
    });
    return;
  }
}; 