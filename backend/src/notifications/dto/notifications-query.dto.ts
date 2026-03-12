import { IsIn, IsOptional } from 'class-validator';

export class NotificationsQueryDto {
  @IsOptional()
  @IsIn(['all', 'unread', 'read'])
  filter?: 'all' | 'unread' | 'read';
}
