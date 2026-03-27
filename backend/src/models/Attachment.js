import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Attachment extends Model {}

Attachment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    request_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    file_path: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Attachment',
    tableName: 'attachments',
    createdAt: 'uploaded_at',
    updatedAt: false,
  }
);

export default Attachment;
