"""
Initial data script for EPOS system
This script populates the database with initial axes, indicators, and users
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def init_database():
    print("🚀 Starting database initialization...")
    
    # Clear existing data
    print("📝 Clearing existing collections...")
    await db.users.delete_many({})
    await db.axes.delete_many({})
    await db.indicators.delete_many({})
    await db.targets.delete_many({})
    await db.values.delete_many({})
    
    # Create users
    print("👥 Creating users...")
    users = [
        {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "password_hash": get_password_hash("admin123"),
            "name": "مدير النظام",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "username": "data_entry",
            "password_hash": get_password_hash("data123"),
            "name": "مدخل البيانات",
            "role": "data_entry",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "username": "viewer",
            "password_hash": get_password_hash("viewer123"),
            "name": "مشاهد مجلس الإدارة",
            "role": "board_viewer",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.users.insert_many(users)
    print(f"   ✅ Created {len(users)} users")
    
    # Create axes
    print("📊 Creating axes...")
    axes = [
        {
            "id": str(uuid.uuid4()),
            "name_ar": "البرامج البيئية التطبيقية ذات الأثر",
            "order": 1,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name_ar": "البناء المؤسسي والحوكمة التشغيلية",
            "order": 2,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name_ar": "الاستدامة المالية وبناء الشراكات",
            "order": 3,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name_ar": "المشاركة المجتمعية وقياس الأثر",
            "order": 4,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name_ar": "مؤشرات مستوى الكيان",
            "order": 5,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.axes.insert_many(axes)
    print(f"   ✅ Created {len(axes)} axes")
    
    # Create indicators for each axis
    print("📈 Creating indicators...")
    
    # Axis 1: البرامج البيئية التطبيقية ذات الأثر
    axis1_indicators = [
        {"name_ar": "عدد البرامج البيئية المفعّلة سنويًا", "type": "performance", "unit": "برنامج"},
        {"name_ar": "عدد المشاريع المنفذة ضمن كل برنامج", "type": "performance", "unit": "مشروع"},
        {"name_ar": "نسبة الالتزام بالخطط الزمنية للمشاريع", "type": "performance", "unit": "%"},
        {"name_ar": "تكلفة التنفيذ مقابل الخطة المعتمدة", "type": "performance", "unit": "%"},
        {"name_ar": "عدد الشراكات التنفيذية لكل برنامج", "type": "performance", "unit": "شراكة"},
        {"name_ar": "نسبة بقاء الغطاء النباتي بعد (12–24) شهرًا", "type": "outcome", "unit": "%"},
        {"name_ar": "نسبة تحسن حالة المواقع البيئية المستهدفة", "type": "outcome", "unit": "%"},
        {"name_ar": "انخفاض مستوى التدهور أو التلوث في المواقع المؤهلة", "type": "outcome", "unit": "%"},
        {"name_ar": "عدد المواقع التي انتقلت من تدخل مؤقت إلى برنامج مستدام", "type": "outcome", "unit": "موقع"},
        {"name_ar": "نسبة رضا الجهات المستفيدة عن النتائج", "type": "outcome", "unit": "%"}
    ]
    
    # Axis 2: البناء المؤسسي والحوكمة التشغيلية
    axis2_indicators = [
        {"name_ar": "عدد السياسات والإجراءات المعتمدة رسميًا", "type": "performance", "unit": "سياسة"},
        {"name_ar": "نسبة الالتزام بتنفيذ الخطة التشغيلية", "type": "performance", "unit": "%"},
        {"name_ar": "عدد الاجتماعات الإدارية المنعقدة وفق الجدول", "type": "performance", "unit": "اجتماع"},
        {"name_ar": "نسبة اكتمال التقارير الدورية في موعدها", "type": "performance", "unit": "%"},
        {"name_ar": "نسبة تحديث دليل الإجراءات سنويًا", "type": "performance", "unit": "%"},
        {"name_ar": "انخفاض نسبة الأخطاء الإدارية", "type": "outcome", "unit": "%"},
        {"name_ar": "مستوى الامتثال للأنظمة واللوائح", "type": "outcome", "unit": "درجة"},
        {"name_ar": "تحسن سرعة اتخاذ القرار", "type": "outcome", "unit": "يوم"},
        {"name_ar": "نسبة رضا الموظفين عن بيئة العمل", "type": "outcome", "unit": "%"},
        {"name_ar": "مستوى نضج الحوكمة (تقييم داخلي سنوي)", "type": "outcome", "unit": "درجة"}
    ]
    
    # Axis 3: الاستدامة المالية وبناء الشراكات
    axis3_indicators = [
        {"name_ar": "إجمالي التمويل السنوي المحصل", "type": "performance", "unit": "ريال"},
        {"name_ar": "نسبة تنوع مصادر الدخل", "type": "performance", "unit": "%"},
        {"name_ar": "عدد الشراكات الموقعة سنويًا", "type": "performance", "unit": "شراكة"},
        {"name_ar": "نسبة تنفيذ خطط جمع التبرعات", "type": "performance", "unit": "%"},
        {"name_ar": "نسبة المصروفات الإدارية من إجمالي الميزانية", "type": "performance", "unit": "%"},
        {"name_ar": "نسبة نمو الموارد المالية السنوية", "type": "outcome", "unit": "%"},
        {"name_ar": "نسبة الاستقرار المالي (احتياطي تشغيلي)", "type": "outcome", "unit": "%"},
        {"name_ar": "استمرارية الشراكات لأكثر من سنة", "type": "outcome", "unit": "%"},
        {"name_ar": "تحسن ثقة المانحين", "type": "outcome", "unit": "درجة"},
        {"name_ar": "نسبة التمويل طويل الأجل مقابل القصير", "type": "outcome", "unit": "%"}
    ]
    
    # Axis 4: المشاركة المجتمعية وقياس الأثر
    axis4_indicators = [
        {"name_ar": "عدد الفعاليات المجتمعية المنفذة", "type": "performance", "unit": "فعالية"},
        {"name_ar": "عدد المشاركين في البرامج البيئية", "type": "performance", "unit": "مشارك"},
        {"name_ar": "عدد الحملات التوعوية المنفذة", "type": "performance", "unit": "حملة"},
        {"name_ar": "عدد المتطوعين المسجلين", "type": "performance", "unit": "متطوع"},
        {"name_ar": "عدد المواد الإعلامية المنشورة", "type": "performance", "unit": "مادة"},
        {"name_ar": "نسبة زيادة الوعي البيئي (استبيانات)", "type": "outcome", "unit": "%"},
        {"name_ar": "نسبة تكرار المشاركة المجتمعية", "type": "outcome", "unit": "%"},
        {"name_ar": "نسبة تحويل المتطوعين إلى داعمين دائمين", "type": "outcome", "unit": "%"},
        {"name_ar": "نسبة تغطية إعلامية إيجابية", "type": "outcome", "unit": "%"},
        {"name_ar": "تحسن سلوك المجتمع تجاه القضايا البيئية", "type": "outcome", "unit": "درجة"}
    ]
    
    # Axis 5: مؤشرات مستوى الكيان
    axis5_indicators = [
        {"name_ar": "عدد الموظفين المؤهلين مهنيًا", "type": "performance", "unit": "موظف"},
        {"name_ar": "نسبة التدريب السنوي للموظفين", "type": "performance", "unit": "%"},
        {"name_ar": "نسبة اكتمال البيانات المؤسسية", "type": "performance", "unit": "%"},
        {"name_ar": "عدد المبادرات التطويرية الداخلية", "type": "performance", "unit": "مبادرة"},
        {"name_ar": "نسبة الالتزام بالهوية المؤسسية", "type": "performance", "unit": "%"},
        {"name_ar": "تصنيف الكيان ضمن الجهات النظيرة", "type": "outcome", "unit": "ترتيب"},
        {"name_ar": "تحسن السمعة المؤسسية", "type": "outcome", "unit": "درجة"},
        {"name_ar": "استقرار الفريق الوظيفي", "type": "outcome", "unit": "%"},
        {"name_ar": "نسبة تحقيق الخطة الاستراتيجية", "type": "outcome", "unit": "%"},
        {"name_ar": "مستوى جاهزية التوسع", "type": "outcome", "unit": "درجة"}
    ]
    
    all_indicators = []
    all_targets = []
    all_values = []
    
    for i, axis in enumerate(axes):
        if i == 0:
            indicators_list = axis1_indicators
        elif i == 1:
            indicators_list = axis2_indicators
        elif i == 2:
            indicators_list = axis3_indicators
        elif i == 3:
            indicators_list = axis4_indicators
        else:
            indicators_list = axis5_indicators
        
        for ind_data in indicators_list:
            indicator_id = str(uuid.uuid4())
            indicator = {
                "id": indicator_id,
                "axis_id": axis["id"],
                "name_ar": ind_data["name_ar"],
                "type": ind_data["type"],
                "unit": ind_data["unit"],
                "description": None,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            all_indicators.append(indicator)
            
            # Create sample targets for 2024
            target_value = 100 if ind_data["unit"] == "%" else (10 if ind_data["unit"] in ["برنامج", "مشروع", "شراكة", "موقع", "سياسة", "اجتماع", "فعالية", "حملة", "مادة", "مبادرة", "موظف", "متطوع", "مشارك"] else 5)
            
            target = {
                "id": str(uuid.uuid4()),
                "indicator_id": indicator_id,
                "year": 2024,
                "target_value": target_value,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            all_targets.append(target)
            
            # Create sample values for Q1 and Q2 of 2024
            for quarter in [1, 2]:
                actual_value = target_value * 0.25 if ind_data["unit"] == "%" else (target_value * 0.25)
                value = {
                    "id": str(uuid.uuid4()),
                    "indicator_id": indicator_id,
                    "year": 2024,
                    "quarter": quarter,
                    "actual_value": actual_value,
                    "notes": f"بيانات تجريبية للربع {quarter}",
                    "created_by": users[0]["id"],
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                all_values.append(value)
    
    await db.indicators.insert_many(all_indicators)
    print(f"   ✅ Created {len(all_indicators)} indicators")
    
    await db.targets.insert_many(all_targets)
    print(f"   ✅ Created {len(all_targets)} targets")
    
    await db.values.insert_many(all_values)
    print(f"   ✅ Created {len(all_values)} sample values")
    
    print("\n✨ Database initialization completed successfully!")
    print("\n📋 Login credentials:")
    print("   Admin: username=admin, password=admin123")
    print("   Data Entry: username=data_entry, password=data123")
    print("   Board Viewer: username=viewer, password=viewer123")

if __name__ == "__main__":
    asyncio.run(init_database())
