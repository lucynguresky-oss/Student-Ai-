import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  body!: string;

  /** present when replying to another comment */
  @IsOptional()
  @IsString()
  parentId?: string;
}
