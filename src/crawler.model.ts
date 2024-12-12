import { Column, Table, Model } from 'sequelize-typescript';
import Sequelize from 'sequelize';

@Table({
  tableName: 'contents',
  paranoid: true,
  deletedAt: 'deletedAt',
  timestamps: true,
})
export class content extends Model {
  @Column({
    primaryKey: true,
    autoIncrement: true,
    type: Sequelize.BIGINT,
  })
  id: number;

  @Column({
    type: Sequelize.JSONB,
    allowNull: false,
  })
  description: string;

  @Column({
    type: Sequelize.STRING,
    allowNull: false,
  })
  url: string;

  @Column({
    type: Sequelize.DATE,
  })
  createdAt: Date;

  @Column({
    type: Sequelize.DATE,
  })
  updatedAt: Date;
}
