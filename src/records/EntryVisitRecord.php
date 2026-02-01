<?php

declare(strict_types=1);

namespace craftcms\quicksearch\records;

use craft\db\ActiveRecord;
use craft\records\Entry;
use craft\records\Site;
use craft\records\User;
use yii\db\ActiveQueryInterface;

/**
 * Entry Visit Record
 *
 * Tracks when users visit entry edit pages in the control panel
 *
 * @property int $id
 * @property int $entryId
 * @property int $siteId
 * @property int $userId
 * @property \DateTime $dateVisited
 * @property \DateTime $dateCreated
 * @property \DateTime $dateUpdated
 * @property string $uid
 *
 * @since 1.0.0
 */
class EntryVisitRecord extends ActiveRecord
{
    /**
     * @inheritdoc
     */
    public static function tableName(): string
    {
        return '{{%quicksearch_entry_visits}}';
    }

    /**
     * Returns the associated entry
     *
     * @return ActiveQueryInterface
     */
    public function getEntry(): ActiveQueryInterface
    {
        return $this->hasOne(Entry::class, ['id' => 'entryId']);
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
