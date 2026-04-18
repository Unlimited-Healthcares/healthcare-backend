import dataSource from './src/datasource';
import { EquipmentItem } from './src/equipment-marketplace/entities/equipment-item.entity';

async function listRealItems() {
    try {
        await dataSource.initialize();
        const items = await dataSource.getRepository(EquipmentItem).find({ take: 5 });
        console.log('REAL_ITEMS_JSON:' + JSON.stringify(items));
        await dataSource.destroy();
    } catch (e) {
        console.error(e);
    }
}
listRealItems();
