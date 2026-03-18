import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('company_settings')
export class CompanySettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Solo existe un registro; este campo identifica que es el de la empresa */
  @Column({ type: 'varchar', unique: true, default: 'default' })
  key: string;

  @Column({ type: 'varchar', default: '' })
  companyName: string;

  @Column({ type: 'varchar', default: '' })
  nit: string;

  @Column({ type: 'varchar', default: '' })
  address: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
