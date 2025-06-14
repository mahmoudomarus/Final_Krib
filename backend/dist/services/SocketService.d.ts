import { Server, Socket } from 'socket.io';
interface AuthenticatedSocket extends Socket {
    user?: {
        id: string;
        email: string;
        isHost: boolean;
    };
}
export declare class SocketService {
    private io;
    private connectedUsers;
    constructor(io: Server);
    handleConnection(socket: AuthenticatedSocket): void;
    private joinUserConversations;
    sendNotificationToUser(userId: string, notification: any): Promise<void>;
    sendPaymentStatusUpdate(userId: string, paymentData: any): Promise<void>;
    sendBookingStatusUpdate(userId: string, bookingData: any): Promise<void>;
    getConnectedUsers(): string[];
    isUserOnline(userId: string): boolean;
}
export {};
//# sourceMappingURL=SocketService.d.ts.map