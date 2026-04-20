import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('profiles')
@Index(['name_lower'], { unique: true })
export class Profile {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar', { length: 255 })
  name!: string;

  @Column('varchar', { length: 255 })
  name_lower!: string;

  @Column('varchar', { length: 10, nullable: true })
  gender: string | null = null;

  @Column('numeric', { precision: 5, scale: 4, nullable: true })
  gender_probability: number | null = null;

  @Column('integer', { nullable: true })
  sample_size: number | null = null;

  @Column('integer', { nullable: true })
  age: number | null = null;

  @Column('varchar', { length: 20, nullable: true })
  age_group: string | null = null;

  @Column('varchar', { length: 2, nullable: true })
  country_id: string | null = null;

  @Column('varchar', { length: 255, nullable: true })
  country_name: string | null = null;

  @Column('numeric', { precision: 5, scale: 4, nullable: true })
  country_probability: number | null = null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at!: Date;
}
