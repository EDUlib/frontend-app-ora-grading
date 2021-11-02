import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import {
  DataTable,
  TextFilter,
  MultiSelectDropdownFilter,
  Container,
} from '@edx/paragon';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';

import { gradingStatuses } from 'data/services/lms/constants';

import { selectors, thunkActions } from 'data/redux';
import lmsMessages from 'data/services/lms/messages';

import StatusBadge from 'components/StatusBadge';
import ReviewModal from 'containers/ReviewModal';

import ListViewBreadcrumb from './ListViewBreadcrumb';
import messages from './messages';
import './ListView.scss';

/**
 * <ListView />
 */
export class ListView extends React.Component {
  constructor(props) {
    super(props);
    this.props.initializeApp();
    this.handleViewAllResponsesClick = this.handleViewAllResponsesClick.bind(this);
    this.selectedBulkAction = this.selectedBulkAction.bind(this);
  }

  get gradeStatusOptions() {
    return Object.keys(gradingStatuses).map(statusKey => ({
      name: this.translate(lmsMessages[gradingStatuses[statusKey]]),
      value: gradingStatuses[statusKey],
    }));
  }

  formatDate = ({ value }) => {
    const date = new Date(value);
    return date.toLocaleString();
  }

  formatGrade = ({ value: grade }) => (
    grade === null ? '-' : `${grade.pointsEarned}/${grade.pointsPossible}`
  );

  formatStatus = ({ value }) => (<StatusBadge status={value} />);

  translate = (...args) => this.props.intl.formatMessage(...args);

  handleViewAllResponsesClick(data) {
    const getSubmissionId = (row) => row.original.submissionId;
    const rows = data.selectedRows.length ? data.selectedRows : data.tableInstance.rows;
    this.props.loadSelectionForReview(rows.map(getSubmissionId));
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
    // hide if submissions are not loaded.
    if (this.props.listData.length === 0) {
      return null;
    }

    return (
      <Container className="py-4">
        <ListViewBreadcrumb />
        <DataTable
          isFilterable
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
              Header: this.translate(messages.username),
              accessor: 'username',
            },
            {
              Header: this.translate(messages.learnerSubmissionDate),
              accessor: 'dateSubmitted',
              Cell: this.formatDate,
              disableFilters: true,
            },
            {
              Header: this.translate(messages.grade),
              accessor: 'score',
              Cell: this.formatGrade,
              disableFilters: true,
            },
            {
              Header: this.translate(messages.gradingStatus),
              accessor: 'gradingStatus',
              Cell: this.formatStatus,
              Filter: MultiSelectDropdownFilter,
              filter: 'includesValue',
              filterChoices: this.gradeStatusOptions,
            },
          ]}
        >
          <DataTable.TableControlBar />
          <DataTable.Table />
          <DataTable.EmptyTable content={this.translate(messages.noResultsFound)} />
          <DataTable.TableFooter />
        </DataTable>
        <ReviewModal />
      </Container>
    );
  }
}
ListView.defaultProps = {
  listData: [],
};
ListView.propTypes = {
  // injected
  intl: intlShape.isRequired,
  // redux
  initializeApp: PropTypes.func.isRequired,
  listData: PropTypes.arrayOf(PropTypes.shape({
    username: PropTypes.string,
    dateSubmitted: PropTypes.number,
    gradingStatus: PropTypes.string,
    grade: PropTypes.shape({
      pointsEarned: PropTypes.number,
      pointsPossible: PropTypes.number,
    }),
  })),
  loadSelectionForReview: PropTypes.func.isRequired,
};

export const mapStateToProps = (state) => ({
  listData: selectors.submissions.listData(state),
});

export const mapDispatchToProps = {
  initializeApp: thunkActions.app.initialize,
  loadSelectionForReview: thunkActions.grading.loadSelectionForReview,
};

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(ListView));
