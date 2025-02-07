import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import {
  DataTable,
  TextFilter,
  MultiSelectDropdownFilter,
} from '@edx/paragon';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';

import { gradingStatuses, submissionFields } from 'data/services/lms/constants';
import lmsMessages from 'data/services/lms/messages';

import { selectors, thunkActions } from 'data/redux';

import StatusBadge from 'components/StatusBadge';
import FilterStatusComponent from './FilterStatusComponent';

import messages from './messages';

/**
 * <SubmissionsTable />
 */
export class SubmissionsTable extends React.Component {
  constructor(props) {
    super(props);
    this.handleViewAllResponsesClick = this.handleViewAllResponsesClick.bind(this);
    this.selectedBulkAction = this.selectedBulkAction.bind(this);
  }

  get gradeStatusOptions() {
    return Object.keys(gradingStatuses).map(statusKey => ({
      name: this.translate(lmsMessages[gradingStatuses[statusKey]]),
      value: gradingStatuses[statusKey],
    }));
  }

  get userLabel() {
    return this.translate(this.props.isIndividual ? messages.username : messages.teamName);
  }

  get userAccessor() {
    return this.props.isIndividual
      ? submissionFields.username
      : submissionFields.teamName;
  }

  get dateSubmittedLabel() {
    return this.translate(this.props.isIndividual
      ? messages.learnerSubmissionDate
      : messages.teamSubmissionDate);
  }

  formatDate = ({ value }) => {
    const date = new Date(value);
    return date.toLocaleString();
  }

  formatGrade = ({ value: score }) => (
    score === null ? '-' : `${score.pointsEarned}/${score.pointsPossible}`
  );

  formatStatus = ({ value }) => (<StatusBadge status={value} />);

  translate = (...args) => this.props.intl.formatMessage(...args);

  handleViewAllResponsesClick(data) {
    const getsubmissionUUID = (row) => row.original.submissionUUID;
    const rows = data.selectedRows.length ? data.selectedRows : data.tableInstance.rows;
    this.props.loadSelectionForReview(rows.map(getsubmissionUUID));
  }

  selectedBulkAction(selectedFlatRows) {
    return {
      buttonText: this.translate(
        messages.viewSelectedResponses,
        { value: selectedFlatRows.length },
      ),
      className: 'view-selected-responses-btn',
      handleClick: this.handleViewAllResponsesClick,
      variant: 'primary',
    };
  }

  render() {
    if (!this.props.listData.length) {
      return null;
    }
    return (
      <DataTable
        isFilterable
        FilterStatusComponent={FilterStatusComponent}
        numBreakoutFilters={2}
        defaultColumnValues={{ Filter: TextFilter }}
        isSelectable
        isSortable
        isPaginated
        itemCount={this.props.listData.length}
        initialState={{ pageSize: 10, pageIndex: 0 }}
        data={this.props.listData}
        tableActions={[
          {
            buttonText: this.translate(messages.viewAllResponses),
            handleClick: this.handleViewAllResponsesClick,
            className: 'view-all-responses-btn',
            variant: 'primary',
          },
        ]}
        bulkActions={[
          this.selectedBulkAction,
        ]}
        columns={[
          {
            Header: this.userLabel,
            accessor: this.userAccessor,
          },
          {
            Header: this.dateSubmittedLabel,
            accessor: submissionFields.dateSubmitted,
            Cell: this.formatDate,
            disableFilters: true,
          },
          {
            Header: this.translate(messages.grade),
            accessor: submissionFields.score,
            Cell: this.formatGrade,
            disableFilters: true,
          },
          {
            Header: this.translate(messages.gradingStatus),
            accessor: submissionFields.gradingStatus,
            Cell: this.formatStatus,
            Filter: MultiSelectDropdownFilter,
            filter: 'includesValue',
            filterChoices: this.gradeStatusOptions,
          },
        ]}
      >
        <DataTable.TableControlBar />
        <DataTable.Table />
        <DataTable.TableFooter />
      </DataTable>
    );
  }
}
SubmissionsTable.defaultProps = {
  listData: [],
};
SubmissionsTable.propTypes = {
  // injected
  intl: intlShape.isRequired,
  // redux
  isIndividual: PropTypes.bool.isRequired,
  listData: PropTypes.arrayOf(PropTypes.shape({
    username: PropTypes.string,
    dateSubmitted: PropTypes.string,
    gradingStatus: PropTypes.string,
    score: PropTypes.shape({
      pointsEarned: PropTypes.number,
      pointsPossible: PropTypes.number,
    }),
  })),
  loadSelectionForReview: PropTypes.func.isRequired,
};

export const mapStateToProps = (state) => ({
  listData: selectors.submissions.listData(state),
  isIndividual: selectors.app.ora.isIndividual(state),
});

export const mapDispatchToProps = {
  loadSelectionForReview: thunkActions.grading.loadSelectionForReview,
};

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(SubmissionsTable));
