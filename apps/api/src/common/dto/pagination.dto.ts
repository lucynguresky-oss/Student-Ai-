import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CursorPaginationDto {
  /** id of the last item from the previous page */
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 15;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
