import { FastifyReply } from 'fastify';
import { ApiResponse, PaginatedResponse } from '@/types';

export const sendSuccess = <T>(
  reply: FastifyReply,
  data: T,
  message = 'Success',
  statusCode = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  
  reply.status(statusCode).send(response);
};

export const sendError = (
  reply: FastifyReply,
  error: string,
  statusCode = 400
): void => {
  const response: ApiResponse = {
    success: false,
    error,
  };
  
  reply.status(statusCode).send(response);
};

export const sendPaginated = <T>(
  reply: FastifyReply,
  data: T[],
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }
): void => {
  const response: PaginatedResponse<T> = {
    data,
    pagination,
  };
  
  sendSuccess(reply, response);
};

export const sendCreated = <T>(
  reply: FastifyReply,
  data: T,
  message = 'Created successfully'
): void => {
  sendSuccess(reply, data, message, 201);
};

export const sendNoContent = (reply: FastifyReply): void => {
  reply.status(204).send();
}; 