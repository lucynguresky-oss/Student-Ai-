import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class MarkReadDto {
  @IsOptional()
  @IsBoolean()
  all?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ids?: string[];
}
