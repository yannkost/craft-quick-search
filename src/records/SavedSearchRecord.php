<?php

declare(strict_types=1);

namespace craftcms\quicksearch\records;

use craft\db\ActiveRecord;
use craft\records\Site;
use craft\records\User;
use yii\db\ActiveQueryInterface;

/**
 * Saved Search Record
 *
 * Stores user's saved searches for quick recall
 *
 * @property int $id
 * @property int $userId
 * @property string $name
 * @property string $query
 * @property string $type
 * @property int|null $siteId
 * @property int $sortOrder
 * @property \DateTime $dateCreated
 * @property \DateTime $dateUpdated
 * @property string $uid
 *
 * @since 1.3.0
 */
class SavedSearchRecord extends ActiveRecord
{
    /**
     * @inheritdoc
     */
    public static function tableName(): string
    {
        return '{{%quicksearch_saved_searches}}';
    }

    /**
     * Returns the associated user
     *
     * @return ActiveQueryInterface
     */
    public function getUser(): ActiveQueryInterface
    {
        return $this->hasOne(User::class, ['id' => 'userId']);
    }

    /**
     * Returns the associated site
     *
     * @return ActiveQueryInterface
     */
    public function getSite(): ActiveQueryInterface
    {
        return $this->hasOne(Site::class, ['id' => 'siteId']);
    }
}
