import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export const VIEW_KEYS = [
  'ventas',
  'historialVentas',
  'productos',
  'facturacion',
  'configuracion',
  'usuarios',
  'auditoria',
] as const;

export type ViewKey = (typeof VIEW_KEYS)[number];

export interface ViewPermissions {
  ventas?: boolean;
  historialVentas?: boolean;
  productos?: boolean;
  facturacion?: boolean;
  configuracion?: boolean;
  usuarios?: boolean;
  auditoria?: boolean;
}

export function defaultPermissions(): ViewPermissions {
  return {
    ventas: true,
    historialVentas: true,
    productos: true,
    facturacion: true,
    configuracion: true,
    usuarios: false,
    auditoria: false,
  };
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'jsonb' })
  viewPermissions: ViewPermissions;

  @CreateDateColumn()
  createdAt: Date;
}
